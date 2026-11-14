import { useState, useEffect } from 'react'
import { addDays } from 'date-fns'
import { apiGetComplexes, apiGetUtilization } from '../../api/endpoints.js'
import { toApiDate, weekRange } from '../../utils/dates.js'
import Loading from '../../components/Loading.jsx'
import Alert from '../../components/Alert.jsx'
import UtilizationHeatmap from '../../components/UtilizationHeatmap.jsx'

const ROOM_TYPE_LABELS = {
  CLASSROOM: 'Classroom',
  LAB: 'Lab',
  LECTURE_HALL: 'Lecture hall',
  SEMINAR_HALL: 'Seminar hall',
}

function getDefaultDates() {
  const { start: currentMonday } = weekRange(new Date())
  return {
    start: toApiDate(addDays(currentMonday, -21)),
    end: toApiDate(addDays(currentMonday, -1)),
  }
}

export default function AnalyticsPage() {
  const defaults = getDefaultDates()
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate] = useState(defaults.end)
  const [complexId, setComplexId] = useState('')
  const [complexes, setComplexes] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGetComplexes()
      .then((res) => setComplexes(res || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    apiGetUtilization({ startDate, endDate, complexId: complexId || undefined })
      .then((res) => {
        if (active) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to load analytics data.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [startDate, endDate, complexId])

  const setLast3Weeks = () => {
    const d = getDefaultDates()
    setStartDate(d.start)
    setEndDate(d.end)
  }

  const setThisWeek = () => {
    const { start: mon } = weekRange(new Date())
    setStartDate(toApiDate(mon))
    setEndDate(toApiDate(addDays(mon, 6)))
  }

  const summary = data?.summary
  const rooms = data?.rooms || []
  const threshold = data?.underusedThresholdPercent ?? 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campus Utilization Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lecture hall and classroom utilization, peak hours, and underused spaces.
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="analytics-start" className="font-medium text-gray-700">From:</label>
            <input
              id="analytics-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <label htmlFor="analytics-end" className="font-medium text-gray-700 ml-1">To:</label>
            <input
              id="analytics-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={setLast3Weeks}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors"
            >
              Last 3 weeks
            </button>
            <button
              type="button"
              onClick={setThisWeek}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors"
            >
              This week
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="complex-select" className="text-xs font-semibold text-gray-700 uppercase">Complex:</label>
          <select
            id="complex-select"
            value={complexId}
            onChange={(e) => setComplexId(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[200px]"
          >
            <option value="">All complexes</option>
            {complexes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <Loading message="Computing utilization analytics..." />
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overall Util.</span>
              <p className="text-2xl font-bold text-blue-600 mt-1">{summary.utilizationPercent.toFixed(1)}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Booked / Available</span>
              <p className="text-lg font-bold text-gray-900 mt-1">{summary.bookedHours.toFixed(1)} / {summary.availableHours.toFixed(1)} h</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scheduled</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.scheduledClasses}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Extra Classes</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.extraClasses}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cancelled</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">{summary.cancelledClasses}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rescheduled</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{summary.rescheduledClasses}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-md border border-gray-200">
            Utilization = booked ÷ available hours on working days (Mon–Fri), 08:00–20:00. Only scheduled classes count. Underused = used less than half as much as the average room (below {threshold}%).
          </p>

          {/* Peak Hours Heatmap */}
          <UtilizationHeatmap heatmap={data.heatmap} />

          {/* Rooms Table */}
          <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Room Breakdown ({rooms.length} active rooms)</h2>
            </div>
            {summary.roomCount === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No active rooms in this selection.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Room</th>
                      <th className="px-6 py-3 text-left">Complex</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-center">Capacity</th>
                      <th className="px-6 py-3 text-center">Classes</th>
                      <th className="px-6 py-3 text-right">Booked h</th>
                      <th className="px-6 py-3 text-right">Available h</th>
                      <th className="px-6 py-3 text-left">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rooms.map((room) => (
                      <tr key={room.roomId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                          {room.roomNumber}
                          {room.underused && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              Underused
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{room.complexName}</td>
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{ROOM_TYPE_LABELS[room.roomType] || room.roomType}</td>
                        <td className="px-6 py-4 text-gray-600 text-center">{room.capacity}</td>
                        <td className="px-6 py-4 text-gray-600 text-center font-medium">{room.classCount}</td>
                        <td className="px-6 py-4 text-gray-900 text-right font-mono">{room.bookedHours.toFixed(1)}</td>
                        <td className="px-6 py-4 text-gray-500 text-right font-mono">{room.availableHours.toFixed(1)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="w-12 font-medium font-mono text-gray-900">{room.utilizationPercent.toFixed(1)}%</span>
                            <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${room.underused ? 'bg-amber-500' : 'bg-blue-600'}`}
                                style={{ width: `${Math.min(100, room.utilizationPercent)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
