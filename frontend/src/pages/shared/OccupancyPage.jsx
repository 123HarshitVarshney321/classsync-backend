import { useState, useEffect } from 'react'
import { addDays } from 'date-fns'
import {
  apiGetComplexes,
  apiGetComplexRooms,
  apiGetOccurrences,
} from '../../api/endpoints.js'
import { toApiDate, parseApiDate } from '../../utils/dates.js'
import OccupancyGrid from '../../components/OccupancyGrid.jsx'
import Alert from '../../components/Alert.jsx'
import Loading from '../../components/Loading.jsx'

export default function OccupancyPage() {
  const [selectedDate, setSelectedDate] = useState(toApiDate(new Date()))
  const [selectedComplexId, setSelectedComplexId] = useState('')
  const [complexes, setComplexes] = useState([])
  const [groupedRooms, setGroupedRooms] = useState([])
  const [occurrences, setOccurrences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load all complexes initially
  useEffect(() => {
    apiGetComplexes()
      .then((data) => setComplexes(data || []))
      .catch((err) => setError(err.message || 'Failed to load complexes.'))
  }, [])

  // Load rooms for active complexes and occurrences for selected date
  useEffect(() => {
    let active = true

    async function fetchData() {
      try {
        const activeComplexes = await apiGetComplexes()
        const filteredComplexes = selectedComplexId
          ? activeComplexes.filter((c) => String(c.id) === String(selectedComplexId))
          : activeComplexes

        const roomPromises = filteredComplexes.map(async (complex) => {
          const rooms = await apiGetComplexRooms(complex.id)
          return {
            complex,
            rooms: rooms || [],
          }
        })
        const roomGroups = await Promise.all(roomPromises)

        const occFilters = {
          startDate: selectedDate,
          endDate: selectedDate,
          status: 'SCHEDULED',
        }
        if (selectedComplexId) {
          occFilters.complexId = selectedComplexId
        }
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
    return () => {
      active = false
    }
  }, [selectedDate, selectedComplexId])

  const handlePrevDay = () => {
    const cur = parseApiDate(selectedDate) || new Date()
    setSelectedDate(toApiDate(addDays(cur, -1)))
  }

  const handleNextDay = () => {
    const cur = parseApiDate(selectedDate) || new Date()
    setSelectedDate(toApiDate(addDays(cur, 1)))
  }

  const handleToday = () => {
    setSelectedDate(toApiDate(new Date()))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daily Occupancy</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visual room occupancy overview for scheduled classes and extra bookings.
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Day Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-gray-300 bg-white shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={handlePrevDay}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-300 transition-colors"
            >
              &larr; Prev Day
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-300 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
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

        {/* Complex Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="complex-filter" className="text-xs font-semibold text-gray-700 uppercase">
            Filter Complex:
          </label>
          <select
            id="complex-filter"
            value={selectedComplexId}
            onChange={(e) => setSelectedComplexId(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[200px]"
          >
            <option value="">All Complexes</option>
            {complexes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <Loading message="Loading room occupancy grid..." />
        </div>
      ) : (
        <OccupancyGrid groupedRooms={groupedRooms} occurrences={occurrences} />
      )}
    </div>
  )
}
