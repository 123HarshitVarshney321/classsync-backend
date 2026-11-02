import { useState, useEffect } from 'react'
import {
  apiGetComplexes,
  apiCreateComplex,
  apiUpdateComplex,
  apiUpdateComplexStatus,
  apiGetComplexRooms,
  apiCreateRoom,
  apiGetRoom,
  apiUpdateRoom,
  apiUpdateRoomStatus,
  apiGetFacilities,
  apiCreateFacility,
  apiUpdateFacility,
  apiUpdateFacilityStatus,
} from '../../api/endpoints.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Loading from '../../components/Loading.jsx'

const ROOM_TYPES = [
  { value: 'CLASSROOM', label: 'Classroom' },
  { value: 'LAB', label: 'Lab' },
  { value: 'LECTURE_HALL', label: 'Lecture hall' },
  { value: 'SEMINAR_HALL', label: 'Seminar hall' },
]

export default function CampusPage() {
  const [activeTab, setActiveTab] = useState('complexes') // 'complexes' | 'rooms' | 'facilities'
  const [includeInactive, setIncludeInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [alertInfo, setAlertInfo] = useState(null)

  // Data
  const [complexes, setComplexes] = useState([])
  const [selectedComplexId, setSelectedComplexId] = useState('')
  const [rooms, setRooms] = useState([])
  const [facilities, setFacilities] = useState([])

  // Modals & Action States
  const [modalType, setModalType] = useState(null) // 'addComplex'|'editComplex'|'addRoom'|'editRoom'|'addFacility'|'editFacility'
  const [activeItem, setActiveItem] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { title, message, onConfirm }
  const [actionLoading, setActionLoading] = useState(false)

  // Form Fields
  const [nameField, setNameField] = useState('')
  const [codeField, setCodeField] = useState('')
  const [roomNumberField, setRoomNumberField] = useState('')
  const [roomTypeField, setRoomTypeField] = useState('CLASSROOM')
  const [capacityField, setCapacityField] = useState('40')
  const [selectedFacilityIds, setSelectedFacilityIds] = useState([])

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([
      apiGetComplexes(includeInactive),
      apiGetFacilities(includeInactive),
    ])
      .then(([comps, facs]) => {
        if (!active) return
        setComplexes(comps || [])
        setFacilities(facs || [])
        if (comps && comps.length > 0) {
          setSelectedComplexId((prev) => (prev ? prev : String(comps[0].id)))
        }
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setAlertInfo({ type: 'error', message: err.message || 'Failed to load campus data.' })
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [includeInactive, refreshKey])

  useEffect(() => {
    if (!selectedComplexId) {
      return
    }
    let active = true
    apiGetComplexRooms(selectedComplexId, includeInactive)
      .then((data) => {
        if (active) setRooms(data || [])
      })
      .catch((err) => {
        if (active) setAlertInfo({ type: 'error', message: err.message || 'Failed to load rooms.' })
      })
    return () => {
      active = false
    }
  }, [selectedComplexId, includeInactive, refreshKey])

  // Complex Handlers
  const openAddComplex = () => {
    setNameField('')
    setCodeField('')
    setModalType('addComplex')
  }

  const openEditComplex = (c) => {
    setActiveItem(c)
    setNameField(c.name)
    setCodeField(c.code)
    setModalType('editComplex')
  }

  const handleSaveComplex = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      if (modalType === 'addComplex') {
        await apiCreateComplex({ name: nameField.trim(), code: codeField.trim().toUpperCase() })
        setAlertInfo({ type: 'success', message: 'Complex created successfully.' })
      } else {
        await apiUpdateComplex(activeItem.id, { name: nameField.trim(), code: codeField.trim().toUpperCase() })
        setAlertInfo({ type: 'success', message: 'Complex updated successfully.' })
      }
      setModalType(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to save complex.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleComplexStatus = (c) => {
    const nextStatus = !c.active
    setConfirmAction({
      title: `${nextStatus ? 'Activate' : 'Deactivate'} Complex`,
      message: `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} ${c.name}?`,
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await apiUpdateComplexStatus(c.id, nextStatus)
          setAlertInfo({ type: 'success', message: `Complex ${nextStatus ? 'activated' : 'deactivated'}.` })
          setConfirmAction(null)
          setRefreshKey((k) => k + 1)
        } catch (err) {
          setAlertInfo({ type: 'error', message: err.message || 'Status update failed.' })
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  // Room Handlers
  const openAddRoom = () => {
    setRoomNumberField('')
    setRoomTypeField('CLASSROOM')
    setCapacityField('40')
    setSelectedFacilityIds([])
    setModalType('addRoom')
  }

  const openEditRoom = async (r) => {
    setActionLoading(true)
    try {
      const detail = await apiGetRoom(r.id, true)
      setActiveItem(detail)
      setRoomNumberField(detail.roomNumber)
      setRoomTypeField(detail.roomType)
      setCapacityField(String(detail.capacity))
      setSelectedFacilityIds(detail.facilities ? detail.facilities.map((f) => f.id) : [])
      setModalType('editRoom')
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to load room details.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveRoom = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      const payload = {
        roomNumber: roomNumberField.trim(),
        roomType: roomTypeField,
        capacity: Number(capacityField),
        facilityIds: selectedFacilityIds,
      }
      if (modalType === 'addRoom') {
        await apiCreateRoom(selectedComplexId, payload)
        setAlertInfo({ type: 'success', message: 'Room created successfully.' })
      } else {
        await apiUpdateRoom(activeItem.id, payload)
        setAlertInfo({ type: 'success', message: 'Room updated successfully.' })
      }
      setModalType(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to save room.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleRoomStatus = (r) => {
    const nextStatus = !r.active
    setConfirmAction({
      title: `${nextStatus ? 'Activate' : 'Deactivate'} Room`,
      message: `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} Room ${r.roomNumber}?`,
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await apiUpdateRoomStatus(r.id, nextStatus)
          setAlertInfo({ type: 'success', message: `Room ${nextStatus ? 'activated' : 'deactivated'}.` })
          setConfirmAction(null)
          setRefreshKey((k) => k + 1)
        } catch (err) {
          setAlertInfo({ type: 'error', message: err.message || 'Status update failed.' })
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  // Facility Handlers
  const openAddFacility = () => {
    setNameField('')
    setModalType('addFacility')
  }

  const openEditFacility = (f) => {
    setActiveItem(f)
    setNameField(f.name)
    setModalType('editFacility')
  }

  const handleSaveFacility = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      if (modalType === 'addFacility') {
        await apiCreateFacility({ name: nameField.trim() })
        setAlertInfo({ type: 'success', message: 'Facility created successfully.' })
      } else {
        await apiUpdateFacility(activeItem.id, { name: nameField.trim() })
        setAlertInfo({ type: 'success', message: 'Facility updated successfully.' })
      }
      setModalType(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to save facility.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleFacilityStatus = (f) => {
    const nextStatus = !f.active
    setConfirmAction({
      title: `${nextStatus ? 'Activate' : 'Deactivate'} Facility`,
      message: `Are you sure you want to ${nextStatus ? 'activate' : 'deactivate'} ${f.name}?`,
      onConfirm: async () => {
        setActionLoading(true)
        try {
          await apiUpdateFacilityStatus(f.id, nextStatus)
          setAlertInfo({ type: 'success', message: `Facility ${nextStatus ? 'activated' : 'deactivated'}.` })
          setConfirmAction(null)
          setRefreshKey((k) => k + 1)
        } catch (err) {
          setAlertInfo({ type: 'error', message: err.message || 'Status update failed.' })
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campus Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage complexes, classrooms and equipment facilities.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none bg-white px-3 py-1.5 rounded-md border border-gray-200">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Show inactive</span>
        </label>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo(null)} />}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {['complexes', 'rooms', 'facilities'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <Loading message="Loading campus structure..." />
      ) : (
        <>
          {/* COMPLEXES TAB */}
          {activeTab === 'complexes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Complexes ({complexes.length})</span>
                <button
                  type="button"
                  onClick={openAddComplex}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs"
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
                    {complexes.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-semibold text-gray-900">{c.name}</td>
                        <td className="px-6 py-3 font-mono text-gray-600">{c.code}</td>
                        <td className="px-6 py-3">
                          <StatusBadge status={c.active ? 'ACTIVE' : 'INACTIVE'} />
                        </td>
                        <td className="px-6 py-3 text-right space-x-3">
                          <button
                            type="button"
                            onClick={() => openEditComplex(c)}
                            className="text-blue-600 hover:underline font-medium text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleComplexStatus(c)}
                            className={`font-medium text-xs hover:underline ${c.active ? 'text-rose-600' : 'text-emerald-600'}`}
                          >
                            {c.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROOMS TAB */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="room-complex-select" className="text-xs font-bold text-gray-700 uppercase">
                    Complex:
                  </label>
                  <select
                    id="room-complex-select"
                    value={selectedComplexId}
                    onChange={(e) => setSelectedComplexId(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    {complexes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openAddRoom}
                  disabled={!selectedComplexId}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs disabled:opacity-50"
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
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          No rooms found in this complex.
                        </td>
                      </tr>
                    ) : (
                      rooms.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-semibold text-gray-900">{r.roomNumber}</td>
                          <td className="px-6 py-3 text-gray-600">
                            {ROOM_TYPES.find((t) => t.value === r.roomType)?.label || r.roomType}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{r.capacity}</td>
                          <td className="px-6 py-3">
                            <StatusBadge status={r.active ? 'ACTIVE' : 'INACTIVE'} />
                          </td>
                          <td className="px-6 py-3 text-right space-x-3">
                            <button
                              type="button"
                              onClick={() => openEditRoom(r)}
                              className="text-blue-600 hover:underline font-medium text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleRoomStatus(r)}
                              className={`font-medium text-xs hover:underline ${r.active ? 'text-rose-600' : 'text-emerald-600'}`}
                            >
                              {r.active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FACILITIES TAB */}
          {activeTab === 'facilities' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Facilities ({facilities.length})</span>
                <button
                  type="button"
                  onClick={openAddFacility}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs"
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
                    {facilities.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-semibold text-gray-900">{f.name}</td>
                        <td className="px-6 py-3">
                          <StatusBadge status={f.active ? 'ACTIVE' : 'INACTIVE'} />
                        </td>
                        <td className="px-6 py-3 text-right space-x-3">
                          <button
                            type="button"
                            onClick={() => openEditFacility(f)}
                            className="text-blue-600 hover:underline font-medium text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFacilityStatus(f)}
                            className={`font-medium text-xs hover:underline ${f.active ? 'text-rose-600' : 'text-emerald-600'}`}
                          >
                            {f.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Complex Modal */}
      {(modalType === 'addComplex' || modalType === 'editComplex') && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={modalType === 'addComplex' ? 'Add Complex' : 'Edit Complex'}
        >
          <form onSubmit={handleSaveComplex} className="space-y-4">
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
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Complex'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Room Modal */}
      {(modalType === 'addRoom' || modalType === 'editRoom') && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={modalType === 'addRoom' ? 'Add Room' : 'Edit Room'}
        >
          <form onSubmit={handleSaveRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Room Number *</label>
              <input
                type="text"
                required
                value={roomNumberField}
                onChange={(e) => setRoomNumberField(e.target.value)}
                placeholder="e.g. SEC-101"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Room Type</label>
                <select
                  value={roomTypeField}
                  onChange={(e) => setRoomTypeField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Capacity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={capacityField}
                  onChange={(e) => setCapacityField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {facilities.length > 0 && (
              <div>
                <span className="block text-xs font-semibold text-gray-700 uppercase mb-2">Facilities</span>
                <div className="flex flex-wrap gap-2">
                  {facilities.map((fac) => {
                    const checked = selectedFacilityIds.includes(fac.id)
                    return (
                      <label
                        key={fac.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs border cursor-pointer ${
                          checked
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedFacilityIds((prev) =>
                              prev.includes(fac.id) ? prev.filter((id) => id !== fac.id) : [...prev, fac.id],
                            )
                          }
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
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Room'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Facility Modal */}
      {(modalType === 'addFacility' || modalType === 'editFacility') && (
        <Modal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={modalType === 'addFacility' ? 'Add Facility' : 'Edit Facility'}
        >
          <form onSubmit={handleSaveFacility} className="space-y-4">
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
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Facility'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Dialog */}
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
