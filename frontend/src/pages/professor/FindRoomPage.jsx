import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router'
import {
  apiGetRecommendations,
  apiGetComplexes,
  apiGetFacilities,
  apiGetOccurrence,
  apiCreateBooking,
  apiRescheduleClass,
} from '../../api/endpoints.js'
import { toApiDate, toHHmm, timeToMinutes } from '../../utils/dates.js'
import Alert from '../../components/Alert.jsx'
import Modal from '../../components/Modal.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Loading from '../../components/Loading.jsx'
import RoomSearchForm from './RoomSearchForm.jsx'
import RecommendationList from './RecommendationList.jsx'

function getInitialTimes() {
  const h = new Date().getHours() + 1
  const nextHour = (h >= 20 || h < 8) ? 9 : h
  return {
    start: `${String(nextHour).padStart(2, '0')}:00`,
    end: `${String(nextHour + 1).padStart(2, '0')}:00`,
  }
}

export default function FindRoomPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const rescheduleId = searchParams.get('reschedule')
  const { start: initStart, end: initEnd } = getInitialTimes()

  const [date, setDate] = useState(toApiDate(new Date()))
  const [startTime, setStartTime] = useState(initStart)
  const [endTime, setEndTime] = useState(initEnd)
  const [capacity, setCapacity] = useState('')
  const [complexId, setComplexId] = useState('')
  const [roomType, setRoomType] = useState('')
  const [selectedFacilities, setSelectedFacilities] = useState([])

  const [complexes, setComplexes] = useState([])
  const [facilities, setFacilities] = useState([])
  const [rescheduleOccurrence, setRescheduleOccurrence] = useState(null)
  const [rescheduleLoadError, setRescheduleLoadError] = useState('')

  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [alertInfo, setAlertInfo] = useState(null)

  const [bookingRoom, setBookingRoom] = useState(null)
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [bookedSuccessInfo, setBookedSuccessInfo] = useState(null)

  const [rescheduleRoom, setRescheduleRoom] = useState(null)
  const [submittingReschedule, setSubmittingReschedule] = useState(false)

  useEffect(() => {
    Promise.all([apiGetComplexes(), apiGetFacilities()])
      .then(([c, f]) => { setComplexes(c || []); setFacilities(f || []) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!rescheduleId) return
    let active = true
    apiGetOccurrence(rescheduleId)
      .then((occ) => {
        if (!active) return
        if (occ.status !== 'SCHEDULED') {
          setRescheduleLoadError(`Class ${occ.courseCode} status is ${occ.status}. Only SCHEDULED classes can be rescheduled.`)
        } else {
          setRescheduleOccurrence(occ)
        }
      })
      .catch((err) => { if (active) setRescheduleLoadError(err.message || 'Failed to load class to reschedule.') })
    return () => { active = false }
  }, [rescheduleId])

  const handleFacilityToggle = (id) => {
    setSelectedFacilities((prev) => (prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]))
  }

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    setAlertInfo(null)
    setBookedSuccessInfo(null)
    if (!date || !startTime || !endTime) {
      setAlertInfo({ type: 'error', message: 'Date, start time and end time are required.' }); return
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setAlertInfo({ type: 'error', message: 'End time must be strictly after start time.' }); return
    }
    if (capacity !== '') {
      const cap = Number(capacity)
      if (!Number.isInteger(cap) || cap <= 0) {
        setAlertInfo({ type: 'error', message: 'Capacity must be a positive whole number.' }); return
      }
    }

    setSearching(true)
    try {
      const params = { date, startTime: toHHmm(startTime), endTime: toHHmm(endTime) }
      if (capacity) params.capacity = capacity
      if (complexId) params.complexId = complexId
      if (roomType) params.roomType = roomType
      if (selectedFacilities.length > 0) params.facilities = selectedFacilities.join(',')
      setResults((await apiGetRecommendations(params)) || [])
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to fetch recommendations.' })
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleConfirmBooking = async (e) => {
    e.preventDefault()
    if (!courseCode.trim() || !courseName.trim()) {
      setAlertInfo({ type: 'error', message: 'Course code and course name are required.' }); return
    }
    setSubmittingBooking(true)
    try {
      await apiCreateBooking({
        roomId: bookingRoom.id, date, startTime: toHHmm(startTime), endTime: toHHmm(endTime),
        courseCode: courseCode.trim().toUpperCase(), courseName: courseName.trim(),
      })
      const roomNum = bookingRoom.roomNumber
      setBookingRoom(null); setCourseCode(''); setCourseName('')
      setBookedSuccessInfo({ room: roomNum, date, start: toHHmm(startTime), end: toHHmm(endTime) })
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Booking failed.' })
      setBookingRoom(null)
    } finally {
      setSubmittingBooking(false)
    }
  }

  const handleConfirmReschedule = async () => {
    if (!rescheduleRoom || !rescheduleOccurrence) return
    setSubmittingReschedule(true)
    try {
      await apiRescheduleClass(rescheduleOccurrence.id, {
        date, startTime: toHHmm(startTime), endTime: toHHmm(endTime), roomId: rescheduleRoom.id,
      })
      setRescheduleRoom(null)
      navigate(`/my-week?date=${date}`)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to reschedule class.' })
      setRescheduleRoom(null)
    } finally {
      setSubmittingReschedule(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {rescheduleOccurrence ? 'Select New Room and Time' : 'Find a Room'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {rescheduleOccurrence ? 'Pick a new slot for the rescheduled class.' : 'Ranked room recommendations with transparent scores.'}
        </p>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo(null)} />}

      {bookedSuccessInfo && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-md text-sm flex items-center justify-between">
          <span>Booked Room {bookedSuccessInfo.room} on {bookedSuccessInfo.date}, {bookedSuccessInfo.start}–{bookedSuccessInfo.end}</span>
          <Link to={`/my-week?date=${bookedSuccessInfo.date}`} className="font-semibold text-emerald-900 underline ml-4">
            View in My Week &rarr;
          </Link>
        </div>
      )}

      {rescheduleLoadError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg">
          <p className="font-medium text-sm">{rescheduleLoadError}</p>
          <Link to="/my-week" className="text-xs text-rose-900 underline mt-2 inline-block">&larr; Return to My Week</Link>
        </div>
      ) : (
        <>
          {rescheduleOccurrence && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg text-sm flex items-center justify-between">
              <div>
                <span className="font-bold">Rescheduling: </span>
                <span>{rescheduleOccurrence.courseCode} ({rescheduleOccurrence.courseName}) on {rescheduleOccurrence.scheduleDate} at {toHHmm(rescheduleOccurrence.startTime)}–{toHHmm(rescheduleOccurrence.endTime)}</span>
              </div>
              <Link to="/my-week" className="text-xs underline text-amber-950 ml-4 font-semibold">Cancel Reschedule</Link>
            </div>
          )}

          <RoomSearchForm
            date={date} setDate={setDate} startTime={startTime} setStartTime={setStartTime}
            endTime={endTime} setEndTime={setEndTime} capacity={capacity} setCapacity={setCapacity}
            complexId={complexId} setComplexId={setComplexId} roomType={roomType} setRoomType={setRoomType}
            selectedFacilities={selectedFacilities} onFacilityToggle={handleFacilityToggle}
            complexes={complexes} facilities={facilities} searching={searching} onSearch={handleSearch}
          />
        </>
      )}

      {searching && <Loading message="Scoring and ranking available rooms..." />}

      <RecommendationList
        results={results}
        rescheduleOccurrence={rescheduleOccurrence}
        onSelectRoom={(r) => (rescheduleOccurrence ? setRescheduleRoom(r) : setBookingRoom(r))}
      />

      {bookingRoom && (
        <Modal isOpen={Boolean(bookingRoom)} onClose={() => setBookingRoom(null)} title={`Book Room ${bookingRoom.roomNumber}`}>
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-200">
              Booking on {date}, {toHHmm(startTime)}–{toHHmm(endTime)} in {bookingRoom.complexName}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Course Code *</label>
              <input type="text" required placeholder="e.g. CS299" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono uppercase" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Course Name *</label>
              <input type="text" required placeholder="e.g. Extra Lab" value={courseName} onChange={(e) => setCourseName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setBookingRoom(null)} disabled={submittingBooking} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md">Cancel</button>
              <button type="submit" disabled={submittingBooking} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {submittingBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={Boolean(rescheduleRoom)}
        title="Confirm Rescheduling"
        message={`Move ${rescheduleOccurrence?.courseCode} to Room ${rescheduleRoom?.roomNumber} on ${date} (${toHHmm(startTime)}–${toHHmm(endTime)})?`}
        confirmText="Confirm Move"
        loading={submittingReschedule}
        onConfirm={handleConfirmReschedule}
        onCancel={() => setRescheduleRoom(null)}
      />
    </div>
  )
}
