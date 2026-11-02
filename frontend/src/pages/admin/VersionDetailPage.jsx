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
import Modal from '../../components/Modal.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Loading from '../../components/Loading.jsx'

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

export default function VersionDetailPage() {
  const { versionId } = useParams()
  const [version, setVersion] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [alertInfo, setAlertInfo] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Options for modal
  const [professors, setProfessors] = useState([])
  const [activeRooms, setActiveRooms] = useState([])

  // Modal & Confirm state
  const [modalMode, setModalMode] = useState(null) // 'add' | 'edit'
  const [activeEntry, setActiveEntry] = useState(null)
  const [entryForm, setEntryForm] = useState({
    professorId: '',
    courseCode: '',
    courseName: '',
    roomId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
  })
  const [saving, setSaving] = useState(false)
  const [deletingEntry, setDeletingEntry] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      apiGetTimetableVersions(),
      apiGetTimetableEntries(versionId),
    ])
      .then(([allVersions, entryList]) => {
        if (!active) return
        const found = allVersions.find((v) => String(v.id) === String(versionId))
        setVersion(found || null)

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

    return () => {
      active = false
    }
  }, [versionId, refreshKey])

  // Load professors and rooms once for the entry modal
  useEffect(() => {
    apiGetUsers({ role: 'PROFESSOR', status: 'ACTIVE' })
      .then((users) => setProfessors(users || []))
      .catch(() => {})

    apiGetComplexes()
      .then(async (comps) => {
        const roomPromises = comps.map((c) =>
          apiGetComplexRooms(c.id).then((rooms) =>
            (rooms || []).map((r) => ({
              ...r,
              complexName: c.name,
              complexCode: c.code,
            })),
          ),
        )
        const nested = await Promise.all(roomPromises)
        setActiveRooms(nested.flat())
      })
      .catch(() => {})
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
        setAlertInfo({ type: 'success', message: 'Timetable entry added.' })
      } else {
        await apiUpdateTimetableEntry(activeEntry.id, payload)
        setAlertInfo({ type: 'success', message: 'Timetable entry updated.' })
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
      await apiDeleteTimetableEntry(deletingEntry.id)
      setDeletingEntry(null)
      setAlertInfo({ type: 'success', message: 'Timetable entry deleted.' })
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
      {/* Back link & Header */}
      <div>
        <Link to="/admin/timetables" className="text-xs font-semibold text-blue-600 hover:underline uppercase tracking-wider">
          &larr; Back to Versions
        </Link>

        {version && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {version.academicYear} — Semester {version.semester} (v{version.versionNumber})
                </h1>
                <StatusBadge status={version.status} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Created on {version.createdAt ? version.createdAt.slice(0, 10) : ''} by {version.createdByName || 'Admin'}
              </p>
            </div>

            {isDraft ? (
              <button
                type="button"
                onClick={openAddEntry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-xs transition-colors"
              >
                Add entry
              </button>
            ) : (
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded border border-gray-200">
                Only DRAFT versions can be edited.
              </span>
            )}
          </div>
        )}
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo(null)} />}

      {loading ? (
        <Loading message="Loading version entries..." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
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
                <tr>
                  <td colSpan={isDraft ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                    No timetable entries in this version yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const dayName = DAYS.find((d) => d.value === entry.dayOfWeek)?.label || `Day ${entry.dayOfWeek}`
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-semibold text-gray-900">{dayName}</td>
                      <td className="px-6 py-3 font-mono text-gray-700">
                        {toHHmm(entry.startTime)}–{toHHmm(entry.endTime)}
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-gray-900">{entry.courseCode}</span>
                        <span className="text-gray-500 text-xs ml-1">({entry.courseName})</span>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{entry.professor?.name}</td>
                      <td className="px-6 py-3 text-gray-700">
                        Room {entry.room?.roomNumber}
                      </td>
                      {isDraft && (
                        <td className="px-6 py-3 text-right space-x-3">
                          <button
                            type="button"
                            onClick={() => openEditEntry(entry)}
                            className="text-blue-600 hover:underline font-semibold text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEntry(entry)}
                            className="text-rose-600 hover:underline font-medium text-xs"
                          >
                            Delete
                          </button>
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

      {/* Add / Edit Entry Modal */}
      {modalMode && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          title={modalMode === 'add' ? 'Add Timetable Entry' : 'Edit Timetable Entry'}
        >
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS101"
                  value={entryForm.courseCode}
                  onChange={(e) => setEntryForm({ ...entryForm, courseCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Intro to Computing"
                  value={entryForm.courseName}
                  onChange={(e) => setEntryForm({ ...entryForm, courseName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Professor *
              </label>
              <select
                required
                value={entryForm.professorId}
                onChange={(e) => setEntryForm({ ...entryForm, professorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">Select Professor</option>
                {professors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Room *
              </label>
              <select
                required
                value={entryForm.roomId}
                onChange={(e) => setEntryForm({ ...entryForm, roomId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value="">Select Room</option>
                {activeRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.complexName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Day of Week *
              </label>
              <select
                value={entryForm.dayOfWeek}
                onChange={(e) => setEntryForm({ ...entryForm, dayOfWeek: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={entryForm.startTime}
                  onChange={(e) => setEntryForm({ ...entryForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  required
                  value={entryForm.endTime}
                  onChange={(e) => setEntryForm({ ...entryForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Entry Confirm Dialog */}
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
