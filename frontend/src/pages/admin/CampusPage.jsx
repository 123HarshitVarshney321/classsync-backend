import { useState, useEffect } from 'react'
import {
  apiGetComplexes,
  apiGetFacilities,
  apiGetComplexRooms,
} from '../../api/endpoints.js'
import Alert from '../../components/Alert.jsx'
import Loading from '../../components/Loading.jsx'
import ComplexesTab from './campus/ComplexesTab.jsx'
import RoomsTab from './campus/RoomsTab.jsx'
import FacilitiesTab from './campus/FacilitiesTab.jsx'

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
    if (!selectedComplexId) return
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

  const handleRefresh = () => setRefreshKey((k) => k + 1)
  const handleSuccess = (message) => setAlertInfo({ type: 'success', message })
  const handleError = (message) => setAlertInfo({ type: 'error', message })

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
          {activeTab === 'complexes' && (
            <ComplexesTab
              complexes={complexes}
              onSuccess={handleSuccess}
              onError={handleError}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomsTab
              complexes={complexes}
              facilities={facilities}
              selectedComplexId={selectedComplexId}
              setSelectedComplexId={setSelectedComplexId}
              rooms={rooms}
              onSuccess={handleSuccess}
              onError={handleError}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'facilities' && (
            <FacilitiesTab
              facilities={facilities}
              onSuccess={handleSuccess}
              onError={handleError}
              onRefresh={handleRefresh}
            />
          )}
        </>
      )}
    </div>
  )
}
