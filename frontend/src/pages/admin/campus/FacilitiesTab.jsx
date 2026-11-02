import { useState } from 'react'
import {
  apiCreateFacility,
  apiUpdateFacility,
  apiUpdateFacilityStatus,
} from '../../../api/endpoints.js'
import StatusBadge from '../../../components/StatusBadge.jsx'
import Modal from '../../../components/Modal.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'

export default function FacilitiesTab({
  facilities,
  onSuccess,
  onError,
  onRefresh,
}) {
  const [modalType, setModalType] = useState(null) // 'add' | 'edit'
  const [activeFacility, setActiveFacility] = useState(null)
  const [nameField, setNameField] = useState('')
  const [saving, setSaving] = useState(false)

  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const openAdd = () => {
    setNameField('')
    setActiveFacility(null)
    setModalType('add')
  }

  const openEdit = (f) => {
    setActiveFacility(f)
    setNameField(f.name)
    setModalType('edit')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modalType === 'add') {
        await apiCreateFacility({ name: nameField.trim() })
        onSuccess('Facility created successfully.')
      } else {
        await apiUpdateFacility(activeFacility.id, { name: nameField.trim() })
        onSuccess('Facility updated successfully.')
      }
      setModalType(null)
      onRefresh()
    } catch (err) {
      onError(err.message || 'Failed to save facility.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = (f) => {
    const nextStatus = !f.active
    setConfirmAction({
      title: `${nextStatus ? 'Activate' : 'Deactivate'} Facility`,
      message: `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} ${f.name}?`,
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await apiUpdateFacilityStatus(f.id, nextStatus)
          onSuccess(`Facility ${nextStatus ? 'activated' : 'deactivated'}.`)
          setConfirmAction(null)
          onRefresh()
        } catch (err) {
          onError(err.message || 'Status update failed.')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">Facilities ({facilities.length})</span>
        <button
          type="button"
          onClick={openAdd}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          Add facility
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {facilities.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                  No facilities found.
                </td>
              </tr>
            ) : (
              facilities.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-gray-900">{f.name}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={f.active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td className="px-6 py-3 text-right space-x-3">
                    <button
                      type="button"
                      onClick={() => openEdit(f)}
                      className="text-blue-600 hover:underline font-medium text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(f)}
                      className={`font-medium text-xs hover:underline ${
                        f.active ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {f.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalType && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={modalType === 'add' ? 'Add Facility' : 'Edit Facility'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Name *</label>
              <input
                type="text"
                required
                value={nameField}
                onChange={(e) => setNameField(e.target.value)}
                placeholder="e.g. Projector"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Facility'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmAction && (
        <ConfirmDialog
          isOpen={true}
          title={confirmAction.title}
          message={confirmAction.message}
          loading={actionLoading}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}

