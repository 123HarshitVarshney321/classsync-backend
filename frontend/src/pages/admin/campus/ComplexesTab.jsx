import { useState } from 'react'
import {
  apiCreateComplex,
  apiUpdateComplex,
  apiUpdateComplexStatus,
} from '../../../api/endpoints.js'
import StatusBadge from '../../../components/StatusBadge.jsx'
import Modal from '../../../components/Modal.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'

export default function ComplexesTab({
  complexes,
  onSuccess,
  onError,
  onRefresh,
}) {
  const [modalType, setModalType] = useState(null) // 'add' | 'edit'
  const [activeComplex, setActiveComplex] = useState(null)
  const [nameField, setNameField] = useState('')
  const [codeField, setCodeField] = useState('')
  const [saving, setSaving] = useState(false)

  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const openAdd = () => {
    setNameField('')
    setCodeField('')
    setActiveComplex(null)
    setModalType('add')
  }

  const openEdit = (c) => {
    setActiveComplex(c)
    setNameField(c.name)
    setCodeField(c.code)
    setModalType('edit')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modalType === 'add') {
        await apiCreateComplex({ name: nameField.trim(), code: codeField.trim().toUpperCase() })
        onSuccess('Complex created successfully.')
      } else {
        await apiUpdateComplex(activeComplex.id, { name: nameField.trim(), code: codeField.trim().toUpperCase() })
        onSuccess('Complex updated successfully.')
      }
      setModalType(null)
      onRefresh()
    } catch (err) {
      onError(err.message || 'Failed to save complex.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = (c) => {
    const nextStatus = !c.active
    setConfirmAction({
      title: `${nextStatus ? 'Activate' : 'Deactivate'} Complex`,
      message: `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} ${c.name}?`,
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await apiUpdateComplexStatus(c.id, nextStatus)
          onSuccess(`Complex ${nextStatus ? 'activated' : 'deactivated'}.`)
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
        <span className="text-sm font-semibold text-gray-700">Complexes ({complexes.length})</span>
        <button
          type="button"
          onClick={openAdd}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
        >
          Add complex
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Code</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {complexes.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No complexes found.
                </td>
              </tr>
            ) : (
              complexes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-6 py-3 font-mono text-gray-600">{c.code}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={c.active ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td className="px-6 py-3 text-right space-x-3">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="text-blue-600 hover:underline font-medium text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c)}
                      className={`font-medium text-xs hover:underline ${
                        c.active ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {c.active ? 'Deactivate' : 'Activate'}
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
          title={modalType === 'add' ? 'Add Complex' : 'Edit Complex'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Name *</label>
              <input
                type="text"
                required
                value={nameField}
                onChange={(e) => setNameField(e.target.value)}
                placeholder="e.g. Science & Engineering Complex"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Code *</label>
              <input
                type="text"
                required
                value={codeField}
                onChange={(e) => setCodeField(e.target.value)}
                placeholder="e.g. SEC"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
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
                {saving ? 'Saving...' : 'Save Complex'}
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

