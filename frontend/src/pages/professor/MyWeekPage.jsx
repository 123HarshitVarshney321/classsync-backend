import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { useAuth } from '../../auth/AuthContext.jsx'
import { apiGetOccurrences, apiCancelClass } from '../../api/endpoints.js'
import { weekRange, toApiDate, toHHmm, parseApiDate } from '../../utils/dates.js'
import WeekNavigator from '../../components/WeekNavigator.jsx'
import WeekCalendar from '../../components/WeekCalendar.jsx'
import Modal from '../../components/Modal.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Alert from '../../components/Alert.jsx'
import Loading from '../../components/Loading.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function MyWeekPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const dateParam = searchParams.get('date')
  const initialDate = dateParam ? parseApiDate(dateParam) || new Date() : new Date()

  const [currentDate, setCurrentDate] = useState(initialDate)
  const [showCancelled, setShowCancelled] = useState(true)
  const [occurrences, setOccurrences] = useState([])
  const [loading, setLoading] = useState(true)
  const [alertInfo, setAlertInfo] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selectedOccurrence, setSelectedOccurrence] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const { start, end, days } = weekRange(currentDate)
  const weekStart = toApiDate(start)
  const weekEnd = toApiDate(end)

  useEffect(() => {
    let active = true
    apiGetOccurrences({
      professorId: user?.id,
      startDate: weekStart,
      endDate: weekEnd,
    })
      .then((data) => {
        if (active) {
          setOccurrences(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setAlertInfo({
            type: 'error',
            message: err.message || 'Failed to load classes for this week.',
          })
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [user?.id, weekStart, weekEnd, refreshKey])

  const handleCancelClass = async () => {
    if (!selectedOccurrence) return
    setActionLoading(true)
    try {
      await apiCancelClass(selectedOccurrence.id)
      setShowCancelConfirm(false)
      setSelectedOccurrence(null)
      setAlertInfo({
        type: 'success',
        message: `Class ${selectedOccurrence.courseCode} cancelled successfully.`,
      })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setAlertInfo({
        type: 'error',
        message: err.message || 'Failed to cancel class.',
      })
      setShowCancelConfirm(false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReschedule = () => {
    if (!selectedOccurrence) return
    navigate(`/find-room?reschedule=${selectedOccurrence.id}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Week</h1>
          <p className="text-sm text-gray-500 mt-1">
            Weekly teaching schedule for Dr. {user?.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/find-room"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            Book an extra class
          </Link>
        </div>
      </div>

      {alertInfo && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
          onClose={() => setAlertInfo(null)}
        />
      )}

      {/* Week Navigator & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <WeekNavigator currentDate={currentDate} onDateChange={setCurrentDate} />

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Show cancelled and moved classes</span>
        </label>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <Loading message="Loading your schedule..." />
        </div>
      ) : occurrences.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
          <p className="text-base font-medium">No classes this week.</p>
          <p className="text-sm text-gray-400 mt-1">
            Use "Book an extra class" to reserve a room.
          </p>
        </div>
      ) : (
        <WeekCalendar
          days={days}
          occurrences={occurrences}
          showCancelled={showCancelled}
          onSelectOccurrence={(occ) => setSelectedOccurrence(occ)}
        />
      )}

      {/* Details Modal */}
      {selectedOccurrence && (
        <Modal
          isOpen={Boolean(selectedOccurrence)}
          onClose={() => setSelectedOccurrence(null)}
          title={`Class Details: ${selectedOccurrence.courseCode}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Course</span>
                <span className="font-semibold text-gray-900">
                  {selectedOccurrence.courseCode} — {selectedOccurrence.courseName}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Status</span>
                <StatusBadge status={selectedOccurrence.status} />
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Date</span>
                <span className="font-medium text-gray-900">{selectedOccurrence.scheduleDate}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Time</span>
                <span className="font-medium text-gray-900">
                  {toHHmm(selectedOccurrence.startTime)} – {toHHmm(selectedOccurrence.endTime)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Room</span>
                <span className="font-medium text-gray-900">
                  Room {selectedOccurrence.room?.roomNumber} ({selectedOccurrence.room?.complex?.name || 'Main'})
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Event Type</span>
                <span className="font-medium text-gray-900">{selectedOccurrence.eventType}</span>
              </div>
            </div>

            {selectedOccurrence.rescheduledFromId && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2.5 rounded">
                This class was rescheduled from another slot (ID: {selectedOccurrence.rescheduledFromId}).
              </div>
            )}

            {/* Actions: only SCHEDULED classes can be cancelled or rescheduled */}
            {selectedOccurrence.status === 'SCHEDULED' ? (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 transition-colors"
                >
                  Cancel class
                </button>
                <button
                  type="button"
                  onClick={handleReschedule}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Reschedule
                </button>
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic pt-2">
                This class is {selectedOccurrence.status.toLowerCase()} and cannot be modified.
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Cancel Class"
        message={`Are you sure you want to cancel ${selectedOccurrence?.courseCode} on ${selectedOccurrence?.scheduleDate}? This cannot be undone.`}
        confirmText="Yes, Cancel Class"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={handleCancelClass}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  )
}
