import { useState, useEffect } from 'react'
import { addDays } from 'date-fns'
import { useAuth } from '../../auth/AuthContext.jsx'
import { apiGetComplexes, apiGetComplexRooms, apiGetOccurrences, apiCancelClass } from '../../api/endpoints.js'
import { toApiDate, parseApiDate, toHHmm, hasStarted } from '../../utils/dates.js'
import OccupancyGrid from '../../components/OccupancyGrid.jsx'
import Alert from '../../components/Alert.jsx'
import Loading from '../../components/Loading.jsx'
import Modal from '../../components/Modal.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'

export default function OccupancyPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [selectedDate, setSelectedDate] = useState(toApiDate(new Date()))
  const [selectedComplexId, setSelectedComplexId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [complexes, setComplexes] = useState([])
  const [groupedRooms, setGroupedRooms] = useState([])
  const [occurrences, setOccurrences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeOccurrence, setActiveOccurrence] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    apiGetComplexes()
      .then((data) => setComplexes(data || []))
      .catch((err) => setError(err.message || 'Failed to load complexes.'))
  }, [])

  useEffect(() => {
    let active = true
    async function fetchData() {
      try {
        const activeComplexes = await apiGetComplexes()
        const filtered = selectedComplexId ? activeComplexes.filter((c) => String(c.id) === String(selectedComplexId)) : activeComplexes
        const roomGroups = await Promise.all(filtered.map(async (complex) => ({
          complex,
          rooms: (await apiGetComplexRooms(complex.id)) || [],
        })))
        const occFilters = { startDate: selectedDate, endDate: selectedDate, status: 'SCHEDULED' }
        if (selectedComplexId) occFilters.complexId = selectedComplexId
        const occData = await apiGetOccurrences(occFilters)

        if (active) {
          setGroupedRooms(roomGroups.filter((g) => g.rooms.length > 0))
          setOccurrences(occData || [])
          setLoading(false)
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load occupancy data.')
          setLoading(false)
        }
      }
    }
    fetchData()
    return () => { active = false }
  }, [selectedDate, selectedComplexId, refreshKey])

  const handlePrevDay = () => setSelectedDate(toApiDate(addDays(parseApiDate(selectedDate) || new Date(), -1)))
  const handleNextDay = () => setSelectedDate(toApiDate(addDays(parseApiDate(selectedDate) || new Date(), 1)))
  const handleToday = () => setSelectedDate(toApiDate(new Date()))

  const handleBlockClick = (occ) => {
    if (!isAdmin) return
    setActiveOccurrence(occ)
    setIsDetailsOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!activeOccurrence) return
    setCancelling(true)
    try {
      await apiCancelClass(activeOccurrence.id)
      setSuccess(`Class ${activeOccurrence.courseCode} cancelled successfully.`)
      setIsConfirmOpen(false)
      setIsDetailsOpen(false)
      setActiveOccurrence(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(err.message || 'Failed to cancel class.')
      setIsConfirmOpen(false)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daily Occupancy</h1>
        <p className="text-sm text-gray-500 mt-1">Visual room occupancy overview for scheduled classes and extra bookings.</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-gray-300 bg-white shadow-xs overflow-hidden">
            <button type="button" onClick={handlePrevDay} className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-300">
              &larr; Prev Day
            </button>
            <button type="button" onClick={handleToday} className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-300">
              Today
            </button>
            <button type="button" onClick={handleNextDay} className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Next Day &rarr;
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="complex-filter" className="text-xs font-semibold text-gray-700 uppercase">Filter Complex:</label>
          <select
            id="complex-filter"
            value={selectedComplexId}
            onChange={(e) => setSelectedComplexId(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[200px]"
          >
            <option value="">All Complexes</option>
            {complexes.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.code})</option>))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <Loading message="Loading room occupancy grid..." />
        </div>
      ) : (
        <OccupancyGrid groupedRooms={groupedRooms} occurrences={occurrences} onBlockClick={isAdmin ? handleBlockClick : undefined} />
      )}

      {isAdmin && activeOccurrence && (
        <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Class Details" maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-semibold text-gray-600">Course:</span>
                <p className="font-bold text-gray-900">{activeOccurrence.courseCode}</p>
                <p className="text-gray-500 text-xs">{activeOccurrence.courseName || '—'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Professor:</span>
                <p className="text-gray-800">{activeOccurrence.professor?.name || '—'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Room:</span>
                <p className="text-gray-800">Room {activeOccurrence.room?.roomNumber}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Date & Time:</span>
                <p className="text-gray-800">{activeOccurrence.scheduleDate}</p>
                <p className="text-gray-500 text-xs font-mono">{toHHmm(activeOccurrence.startTime)}–{toHHmm(activeOccurrence.endTime)}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Type:</span>
                <p className="text-gray-800">{activeOccurrence.eventType}</p>
              </div>
            </div>
            {hasStarted(activeOccurrence.scheduleDate, activeOccurrence.startTime) ? (
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500 italic">
                  This class has already started, so it can't be cancelled or rescheduled.
                </span>
                <button type="button" onClick={() => setIsDetailsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Close
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsDetailsOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Close
                </button>
                <button type="button" onClick={() => setIsConfirmOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md">
                  Cancel class
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Cancel Class"
        message={`Are you sure you want to cancel ${activeOccurrence?.courseCode} on ${activeOccurrence?.scheduleDate}? This cannot be undone.`}
        confirmText="Yes, cancel class"
        isDestructive={true}
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  )
}
