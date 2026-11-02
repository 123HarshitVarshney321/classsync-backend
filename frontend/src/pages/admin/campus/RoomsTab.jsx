import { useState } from 'react'
import {
  apiCreateRoom,
  apiGetRoom,
  apiUpdateRoom,
  apiUpdateRoomStatus,
} from '../../../api/endpoints.js'
import StatusBadge from '../../../components/StatusBadge.jsx'
import Modal from '../../../components/Modal.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'

const ROOM_TYPES = [
  { value: 'CLASSROOM', label: 'Classroom' },
  { value: 'LAB', label: 'Lab' },
  { value: 'LECTURE_HALL', label: 'Lecture hall' },
  { value: 'SEMINAR_HALL', label: 'Seminar hall' },
]

export default function RoomsTab({
  complexes,
  facilities,
  selectedComplexId,
  setSelectedComplexId,
  rooms,
  onSuccess,
  onError,
  onRefresh,
}) {
  const [modalType, setModalType] = useState(null) // 'add' | 'edit'
  const [activeRoom, setActiveRoom] = useState(null)
  const [roomNumberField, setRoomNumberField] = useState('')
  const [roomTypeField, setRoomTypeField] = useState('CLASSROOM')
  const [capacityField, setCapacityField] = useState('40')
  const [selectedFacilityIds, setSelectedFacilityIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const openAdd = () => {
    setRoomNumberField('')
    setRoomTypeField('CLASSROOM')
    setCapacityField('40')
    setSelectedFacilityIds([])
    setActiveRoom(null)
    setModalType('add')
  }

  const openEdit = async (r) => {
    setActionLoading(true)
    try {
      const detail = await apiGetRoom(r.id, true)
      setActiveRoom(detail)
      setRoomNumberField(detail.roomNumber)
      setRoomTypeField(detail.roomType)
      setCapacityField(String(detail.capacity))
      setSelectedFacilityIds((detail.facilities || []).map((f) => f.id))
      setModalType('edit')
    } catch (err) {
      onError(err.message || 'Failed to load room details.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        complexId: Number(selectedComplexId),
        roomNumber: roomNumberField.trim(),
        roomType: roomTypeField,
        capacity: Number(capacityField),
        facilityIds: selectedFacilityIds,
      }
      if (modalType === 'add') {
        await apiCreateRoom(payload)
        onSuccess('Room created successfully.')
      } else {
        await apiUpdateRoom(activeRoom.id, payload)
        onSuccess('Room updated successfully.')
      }
      setModalType(null)
      onRefresh()
    } catch (err) {
      onError(err.message || 'Failed to save room.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = (r) => {
    const nextStatus = !r.active
    setConfirmAction({
      title: `${nextStatus ? 'Activate' : 'Deactivate'} Room`,
      message: `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} Room ${r.roomNumber}?`,
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await apiUpdateRoomStatus(r.id, nextStatus)
          onSuccess(`Room ${nextStatus ? 'activated' : 'deactivated'}.`)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="room-complex-select" className="text-xs font-bold text-gray-700 uppercase">Complex:</label>
          <select
            id="room-complex-select"
            value={selectedComplexId}
            onChange={(e) => setSelectedComplexId(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
          >
            {complexes.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.code})</option>))}
          </select>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={!selectedComplexId}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs disabled:opacity-50 transition-colors"
        >
          Add room
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Room #</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Capacity</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No rooms found for this complex.</td></tr>
            ) : (
              rooms.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-gray-900">{r.roomNumber}</td>
                  <td className="px-6 py-3 text-gray-600">{ROOM_TYPES.find((t) => t.value === r.roomType)?.label || r.roomType}</td>
                  <td className="px-6 py-3 text-gray-600">{r.capacity}</td>
                  <td className="px-6 py-3"><StatusBadge status={r.active ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td className="px-6 py-3 text-right space-x-3">
                    <button type="button" onClick={() => openEdit(r)} className="text-blue-600 hover:underline font-medium text-xs">Edit</button>
                    <button type="button" onClick={() => handleToggleStatus(r)} className={`font-medium text-xs hover:underline ${r.active ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {r.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalType && (
        <Modal isOpen={true} onClose={() => setModalType(null)} title={modalType === 'add' ? 'Add Room' : 'Edit Room'}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Room Number *</label>
              <input type="text" required value={roomNumberField} onChange={(e) => setRoomNumberField(e.target.value)} placeholder="e.g. SEC-101" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Room Type *</label>
                <select value={roomTypeField} onChange={(e) => setRoomTypeField(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
                  {ROOM_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Capacity *</label>
                <input type="number" min="1" required value={capacityField} onChange={(e) => setCapacityField(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
            </div>
            {facilities.length > 0 && (
              <div>
                <span className="block text-xs font-semibold text-gray-700 uppercase mb-2">Facilities</span>
                <div className="flex flex-wrap gap-2">
                  {facilities.map((fac) => {
                    const checked = selectedFacilityIds.includes(fac.id)
                    return (
                      <label key={fac.id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs border cursor-pointer ${checked ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setSelectedFacilityIds((prev) => prev.includes(fac.id) ? prev.filter((id) => id !== fac.id) : [...prev, fac.id])}
                          className="sr-only"
                        />
                        <span>{fac.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Room'}
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
