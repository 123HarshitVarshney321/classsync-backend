import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import {
  apiGetTimetableVersions,
  apiGetTimetableEntries,
  apiCreateTimetableEntry,
  apiUpdateTimetableEntry,
  apiDeleteTimetableEntry,
  apiGetUsers,
  apiGetComplexes,
  apiGetComplexRooms,
} from '../../api/endpoints.js'
import { toHHmm } from '../../utils/dates.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import Alert from '../../components/Alert.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Loading from '../../components/Loading.jsx'
import EntryFormModal, { DAYS } from './EntryFormModal.jsx'

export default function VersionDetailPage() {
  const { versionId } = useParams()
  const [version, setVersion] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [alertInfo, setAlertInfo] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [professors, setProfessors] = useState([])
  const [activeRooms, setActiveRooms] = useState([])
  const [modalMode, setModalMode] = useState(null) // 'add' | 'edit'
  const [activeEntry, setActiveEntry] = useState(null)
  const [entryForm, setEntryForm] = useState({
    professorId: '', courseCode: '', courseName: '', roomId: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00',
  })
  const [saving, setSaving] = useState(false)
  const [deletingEntry, setDeletingEntry] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([apiGetTimetableVersions(), apiGetTimetableEntries(versionId)])
      .then(([allVersions, entryList]) => {
        if (!active) return
        setVersion(allVersions.find((v) => String(v.id) === String(versionId)) || null)
        const sorted = (entryList || []).slice().sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
          return a.startTime.localeCompare(b.startTime)
        })
        setEntries(sorted)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setAlertInfo({ type: 'error', message: err.message || 'Failed to load timetable entries.' })
        setLoading(false)
      })
    return () => { active = false }
  }, [versionId, refreshKey])

  useEffect(() => {
    apiGetUsers({ role: 'PROFESSOR', status: 'ACTIVE' }).then((u) => setProfessors(u || [])).catch(() => {})
    apiGetComplexes().then(async (comps) => {
      const roomPromises = comps.map((c) =>
        apiGetComplexRooms(c.id).then((rooms) => (rooms || []).map((r) => ({ ...r, complexName: c.name, complexCode: c.code }))),
      )
      const nested = await Promise.all(roomPromises)
      setActiveRooms(nested.flat())
    }).catch(() => {})
  }, [])

  const openAddEntry = () => {
    setEntryForm({
      professorId: professors[0]?.id ? String(professors[0].id) : '',
      courseCode: '',
      courseName: '',
      roomId: activeRooms[0]?.id ? String(activeRooms[0].id) : '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
    })
    setModalMode('add')
  }

  const openEditEntry = (entry) => {
    setActiveEntry(entry)
    setEntryForm({
      professorId: String(entry.professor?.id || ''),
      courseCode: entry.courseCode || '',
      courseName: entry.courseName || '',
      roomId: String(entry.room?.id || ''),
      dayOfWeek: entry.dayOfWeek || 1,
      startTime: toHHmm(entry.startTime),
      endTime: toHHmm(entry.endTime),
    })
    setModalMode('edit')
  }

  const handleSaveEntry = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        professorId: Number(entryForm.professorId),
        courseCode: entryForm.courseCode.trim().toUpperCase(),
        courseName: entryForm.courseName.trim(),
        roomId: Number(entryForm.roomId),
        dayOfWeek: Number(entryForm.dayOfWeek),
        startTime: toHHmm(entryForm.startTime),
        endTime: toHHmm(entryForm.endTime),
      }
      if (modalMode === 'add') {
        await apiCreateTimetableEntry(versionId, payload)
        setAlertInfo({ type: 'success', message: 'Timetable entry added successfully.' })
      } else {
        await apiUpdateTimetableEntry(versionId, activeEntry.id, payload)
        setAlertInfo({ type: 'success', message: 'Timetable entry updated successfully.' })
      }
      setModalMode(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to save entry.' })
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingEntry) return
    setDeleting(true)
    try {
      await apiDeleteTimetableEntry(versionId, deletingEntry.id)
      setAlertInfo({ type: 'success', message: 'Timetable entry deleted successfully.' })
      setDeletingEntry(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to delete entry.' })
    } finally {
      setDeleting(false)
    }
  }

  const isDraft = version?.status === 'DRAFT'

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/admin/timetables" className="hover:underline">&larr; Back to Timetables</Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span>Timetable {version ? `${version.academicYear} / Sem ${version.semester} (v${version.versionNumber})` : '...'}</span>
            {version && <StatusBadge status={version.status} />}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isDraft ? 'Draft version. Add, edit or delete weekly scheduled master entries before activating.' : 'This timetable is locked. Only DRAFT versions can be modified.'}
          </p>
        </div>
        {isDraft && (
          <button type="button" onClick={openAddEntry} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-xs transition-colors">
            Add entry
          </button>
        )}
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo(null)} />}

      {loading ? (
        <Loading message="Loading timetable version details..." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-900">Master Entries ({entries.length})</span>
            <span className="text-xs text-gray-500">Sorted by day and start time</span>
          </div>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Day</th>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Course</th>
                <th className="px-6 py-3 text-left">Professor</th>
                <th className="px-6 py-3 text-left">Room</th>
                {isDraft && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.length === 0 ? (
                <tr><td colSpan={isDraft ? 6 : 5} className="px-6 py-8 text-center text-gray-500">No entries in this timetable version yet.</td></tr>
              ) : (
                entries.map((entry) => {
                  const dayName = DAYS.find((d) => d.value === entry.dayOfWeek)?.label || `Day ${entry.dayOfWeek}`
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-gray-900">{dayName}</td>
                      <td className="px-6 py-3 font-mono text-gray-700">{toHHmm(entry.startTime)} &ndash; {toHHmm(entry.endTime)}</td>
                      <td className="px-6 py-3">
                        <span className="font-semibold text-gray-900">{entry.courseCode}</span>
                        <span className="text-xs text-gray-500 block">{entry.courseName}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        <div>{entry.professor?.name}</div>
                        <div className="text-xs text-gray-400">{entry.professor?.email}</div>
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        <span className="font-medium">Room {entry.room?.roomNumber}</span>
                        <span className="text-xs text-gray-500 block">{entry.room?.complex?.name || 'Complex'} ({entry.room?.complex?.code || ''})</span>
                      </td>
                      {isDraft && (
                        <td className="px-6 py-3 text-right space-x-3">
                          <button type="button" onClick={() => openEditEntry(entry)} className="text-blue-600 hover:underline font-medium text-xs">Edit</button>
                          <button type="button" onClick={() => setDeletingEntry(entry)} className="text-rose-600 hover:underline font-medium text-xs">Delete</button>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <EntryFormModal
        isOpen={Boolean(modalMode)}
        onClose={() => setModalMode(null)}
        modalMode={modalMode}
        entryForm={entryForm}
        setEntryForm={setEntryForm}
        professors={professors}
        activeRooms={activeRooms}
        saving={saving}
        onSave={handleSaveEntry}
      />

      {deletingEntry && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Timetable Entry"
          message={`Are you sure you want to delete ${deletingEntry.courseCode} (${deletingEntry.courseName})?`}
          confirmText="Yes, Delete"
          isDestructive={true}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingEntry(null)}
        />
      )}
    </div>
  )
}
