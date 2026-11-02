import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  apiGetTimetableVersions,
  apiCreateTimetableVersion,
  apiActivateTimetableVersion,
  apiArchiveTimetableVersion,
} from '../../api/endpoints.js'
import { toApiDate } from '../../utils/dates.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Loading from '../../components/Loading.jsx'
import ActivateVersionModal from './ActivateVersionModal.jsx'

export default function TimetablesPage() {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [alertInfo, setAlertInfo] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [academicYear, setAcademicYear] = useState('2026-27')
  const [semester, setSemester] = useState('1')
  const [creating, setCreating] = useState(false)

  const [activatingVersion, setActivatingVersion] = useState(null)
  const [effectiveFrom, setEffectiveFrom] = useState(toApiDate(new Date()))
  const [activating, setActivating] = useState(false)

  const [archivingVersion, setArchivingVersion] = useState(null)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => {
    let active = true
    apiGetTimetableVersions()
      .then((data) => { if (active) { setVersions(data || []); setLoading(false) } })
      .catch((err) => { if (active) { setAlertInfo({ type: 'error', message: err.message || 'Failed to load timetable versions.' }); setLoading(false) } })
    return () => { active = false }
  }, [refreshKey])

  const handleCreateDraft = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await apiCreateTimetableVersion({ academicYear: academicYear.trim(), semester: semester.trim() })
      setShowCreateModal(false)
      setAlertInfo({ type: 'success', message: 'New draft version created.' })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to create draft version.' })
    } finally {
      setCreating(false)
    }
  }

  const handleConfirmActivate = async (e) => {
    e.preventDefault()
    if (!activatingVersion) return
    setActivating(true)
    try {
      const res = await apiActivateTimetableVersion(activatingVersion.id, effectiveFrom)
      setActivatingVersion(null)
      const archMsg = res.archivedVersionId ? `Archived version: ${res.archivedVersionId}.` : 'Archived version: none.'
      const countMsg = `${res.supersededOccurrenceCount ?? 0} future classes superseded.`
      setAlertInfo({ type: 'success', message: `Version activated. ${archMsg} ${countMsg}` })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Activation failed.' })
    } finally {
      setActivating(false)
    }
  }

  const handleConfirmArchive = async () => {
    if (!archivingVersion) return
    setArchiving(true)
    try {
      await apiArchiveTimetableVersion(archivingVersion.id)
      setArchivingVersion(null)
      setAlertInfo({ type: 'success', message: 'Version archived successfully.' })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to archive version.' })
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Timetable Versions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage semester master blueprints, draft revisions, activations and archives.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-xs transition-colors"
        >
          New draft
        </button>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo(null)} />}

      {loading ? (
        <Loading message="Loading timetable versions..." />
      ) : versions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
          <p className="font-semibold text-base">No timetable versions found.</p>
          <p className="text-sm text-gray-400 mt-1">Click "New draft" above to create the first semester timetable blueprint.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Academic Year</th>
                <th className="px-6 py-3 text-left">Semester</th>
                <th className="px-6 py-3 text-left">Version</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Created By</th>
                <th className="px-6 py-3 text-left">Created At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {versions.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-gray-900">{v.academicYear}</td>
                  <td className="px-6 py-3 text-gray-700">{v.semester}</td>
                  <td className="px-6 py-3 font-mono text-gray-600">v{v.versionNumber}</td>
                  <td className="px-6 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-6 py-3 text-gray-600">{v.createdByName || 'Admin'}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{v.createdAt ? v.createdAt.slice(0, 10) : '—'}</td>
                  <td className="px-6 py-3 text-right space-x-3">
                    <Link to={`/admin/timetables/${v.id}`} className="text-blue-600 hover:underline font-semibold text-xs">Open</Link>
                    {v.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => { setActivatingVersion(v); setEffectiveFrom(toApiDate(new Date())) }}
                        className="text-emerald-600 hover:underline font-semibold text-xs"
                      >
                        Activate
                      </button>
                    )}
                    {(v.status === 'DRAFT' || v.status === 'ACTIVE') && (
                      <button
                        type="button"
                        onClick={() => setArchivingVersion(v)}
                        className="text-gray-500 hover:text-gray-700 hover:underline font-medium text-xs"
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <Modal isOpen={true} onClose={() => setShowCreateModal(false)} title="Create New Timetable Draft">
          <form onSubmit={handleCreateDraft} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Academic Year *</label>
              <input type="text" required value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2026-27" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Semester *</label>
              <input type="text" required value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="1" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md">Cancel</button>
              <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Draft'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ActivateVersionModal
        isOpen={Boolean(activatingVersion)}
        version={activatingVersion}
        effectiveFrom={effectiveFrom}
        setEffectiveFrom={setEffectiveFrom}
        loading={activating}
        onConfirm={handleConfirmActivate}
        onClose={() => setActivatingVersion(null)}
      />

      {archivingVersion && (
        <ConfirmDialog
          isOpen={true}
          title="Archive Timetable Version"
          message={`Are you sure you want to archive version ${archivingVersion.academicYear} Sem ${archivingVersion.semester} (v${archivingVersion.versionNumber})?`}
          confirmText="Yes, Archive"
          isDestructive={true}
          loading={archiving}
          onConfirm={handleConfirmArchive}
          onCancel={() => setArchivingVersion(null)}
        />
      )}
    </div>
  )
}
