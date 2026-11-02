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

function getInitialTimes() {
  const now = new Date()
  let nextHour = now.getHours() + 1
  if (nextHour >= 20 || nextHour < 8) nextHour = 9
  return {
    start: `${String(nextHour).padStart(2, '0')}:00`,
    end: `${String(nextHour + 1).padStart(2, '0')}:00`,
  }
}

const ROOM_TYPES = [
  { value: 'CLASSROOM', label: 'Classroom' },
  { value: 'LAB', label: 'Lab' },
  { value: 'LECTURE_HALL', label: 'Lecture hall' },
  { value: 'SEMINAR_HALL', label: 'Seminar hall' },
]

export default function FindRoomPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const rescheduleId = searchParams.get('reschedule')
  const { start: initStart, end: initEnd } = getInitialTimes()

  // Form State
  const [date, setDate] = useState(toApiDate(new Date()))
  const [startTime, setStartTime] = useState(initStart)
  const [endTime, setEndTime] = useState(initEnd)
  const [capacity, setCapacity] = useState('')
  const [complexId, setComplexId] = useState('')
  const [roomType, setRoomType] = useState('')
  const [selectedFacilities, setSelectedFacilities] = useState([])

  // Options & Reschedule Target
  const [complexes, setComplexes] = useState([])
  const [facilities, setFacilities] = useState([])
  const [rescheduleOccurrence, setRescheduleOccurrence] = useState(null)
  const [rescheduleLoadError, setRescheduleLoadError] = useState('')

  // Results & UI
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [alertInfo, setAlertInfo] = useState(null)

  // Booking Modal
  const [bookingRoom, setBookingRoom] = useState(null)
  const [courseCode, setCourseCode] = useState('')
  const [courseName, setCourseName] = useState('')
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [bookedSuccessInfo, setBookedSuccessInfo] = useState(null)

  // Reschedule Confirmation
  const [rescheduleRoom, setRescheduleRoom] = useState(null)
  const [submittingReschedule, setSubmittingReschedule] = useState(false)

  useEffect(() => {
    Promise.all([apiGetComplexes(), apiGetFacilities()]).then(([c, f]) => {
      setComplexes(c || [])
      setFacilities(f || [])
    }).catch(() => {})
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
      .catch((err) => {
        if (active) setRescheduleLoadError(err.message || 'Failed to load class to reschedule.')
      })
    return () => { active = false }
  }, [rescheduleId])

  const handleFacilityToggle = (id) => {
    setSelectedFacilities((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id],
    )
  }

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    setAlertInfo(null)
    setBookedSuccessInfo(null)

    if (!date || !startTime || !endTime) {
      setAlertInfo({ type: 'error', message: 'Date, start time and end time are required.' })
      return
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setAlertInfo({ type: 'error', message: 'End time must be strictly after start time.' })
      return
    }
    if (capacity !== '') {
      const cap = Number(capacity)
      if (!Number.isInteger(cap) || cap <= 0) {
        setAlertInfo({ type: 'error', message: 'Capacity must be a positive whole number.' })
        return
      }
    }

    setSearching(true)
    try {
      const params = { date, startTime: toHHmm(startTime), endTime: toHHmm(endTime) }
      if (capacity) params.capacity = capacity
      if (complexId) params.complexId = complexId
      if (roomType) params.roomType = roomType
      if (selectedFacilities.length > 0) params.facilities = selectedFacilities.join(',')

      const data = await apiGetRecommendations(params)
      setResults(data || [])
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
      setAlertInfo({ type: 'error', message: 'Course code and course name are required.' })
      return
    }

    setSubmittingBooking(true)
    try {
      await apiCreateBooking({
        roomId: bookingRoom.id,
        date,
        startTime: toHHmm(startTime),
        endTime: toHHmm(endTime),
        courseCode: courseCode.trim().toUpperCase(),
        courseName: courseName.trim(),
      })
      const roomNum = bookingRoom.roomNumber
      setBookingRoom(null)
      setCourseCode('')
      setCourseName('')
      setBookedSuccessInfo({ room: roomNum, date, start: toHHmm(startTime), end: toHHmm(endTime) })
      handleSearch()
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
        date,
        startTime: toHHmm(startTime),
        endTime: toHHmm(endTime),
        roomId: rescheduleRoom.id,
      })
      navigate(`/my-week?date=${date}`, {
        state: { message: `Moved ${rescheduleOccurrence.courseCode} to Room ${rescheduleRoom.roomNumber} on ${date}.` },
      })
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Rescheduling failed.' })
      setRescheduleRoom(null)
    } finally {
      setSubmittingReschedule(false)
    }
  }

  if (rescheduleLoadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert type="error" message={rescheduleLoadError} className="mb-4" />
        <Link to="/my-week" className="text-blue-600 hover:underline text-sm font-medium">&larr; Back to My Week</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {rescheduleOccurrence && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div>
            <div className="font-bold text-amber-900 text-base">
              Rescheduling {rescheduleOccurrence.courseCode} — {rescheduleOccurrence.scheduleDate}, {toHHmm(rescheduleOccurrence.startTime)}–{toHHmm(rescheduleOccurrence.endTime)}, Room {rescheduleOccurrence.room?.roomNumber}
            </div>
            <div className="text-amber-800 text-xs mt-0.5">{rescheduleOccurrence.courseName}</div>
          </div>
          <Link to="/my-week" className="text-xs font-semibold text-amber-900 hover:underline uppercase">Cancel</Link>
        </div>
      )}

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
          <span>Booked {bookedSuccessInfo.room} on {bookedSuccessInfo.date}, {bookedSuccessInfo.start}–{bookedSuccessInfo.end}</span>
          <Link to={`/my-week?date=${bookedSuccessInfo.date}`} className="font-semibold text-emerald-900 underline ml-4">
            View in My Week &rarr;
          </Link>
        </div>
      )}

      <form onSubmit={handleSearch} className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Date *</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Start Time *</label>
            <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">End Time *</label>
            <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Min Capacity</label>
            <input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 30" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Complex</label>
            <select value={complexId} onChange={(e) => setComplexId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
              <option value="">All Complexes</option>
              {complexes.map((c) => (<option key={c.id} value={c.id}>{c.name} ({c.code})</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Room Type</label>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white">
              <option value="">Any Room Type</option>
              {ROOM_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
          </div>
        </div>

        {facilities.length > 0 && (
          <div>
            <span className="block text-xs font-semibold text-gray-700 uppercase mb-2">Required Facilities</span>
            <div className="flex flex-wrap gap-2">
              {facilities.map((fac) => (
                <label key={fac.id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs border cursor-pointer ${selectedFacilities.includes(fac.id) ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <input type="checkbox" checked={selectedFacilities.includes(fac.id)} onChange={() => handleFacilityToggle(fac.id)} className="sr-only" />
                  <span>{fac.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={searching} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-xs disabled:opacity-50">
            {searching ? 'Finding Rooms...' : 'Find Available Rooms'}
          </button>
        </div>
      </form>

      {searching && <Loading message="Evaluating rooms and availability..." />}

      {!searching && results !== null && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Recommended Rooms ({results.length})</h2>
          {results.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
              <p className="font-semibold text-base">No rooms are free for this slot.</p>
              <p className="text-sm text-gray-500 mt-1">If you already have a class at this time (including the class you are moving), the search returns nothing — try another time.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {results.map((item, index) => {
                const { room, score, reasons } = item
                const scorePercent = Math.min(100, Math.max(0, Math.round(score)))
                return (
                  <div key={room.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">#{index + 1}</span>
                        <span className="text-base font-bold text-gray-900">Room {room.roomNumber}</span>
                        <span className="text-sm text-gray-600 font-medium">{room.complexName}</span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{ROOM_TYPES.find((t) => t.value === room.roomType)?.label || room.roomType}</span>
                        <span className="text-xs text-gray-500">Cap: {room.capacity}</span>
                      </div>
                      <div className="flex items-center gap-3 max-w-xs">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${scorePercent}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-10">{scorePercent}%</span>
                      </div>
                      {reasons && reasons.length > 0 && (
                        <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
                          {reasons.map((r, rIdx) => (<li key={rIdx}>{r}</li>))}
                        </ul>
                      )}
                    </div>
                    <div>
                      {rescheduleOccurrence ? (
                        <button type="button" onClick={() => setRescheduleRoom(room)} className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-md">
                          Move here
                        </button>
                      ) : (
                        <button type="button" onClick={() => setBookingRoom(room)} className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md">
                          Book
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {bookingRoom && (
        <Modal isOpen={Boolean(bookingRoom)} onClose={() => setBookingRoom(null)} title={`Book Room ${bookingRoom.roomNumber}`}>
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-200">
              Booking on {date}, {toHHmm(startTime)}–{toHHmm(endTime)} in {bookingRoom.complexName}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Course Code *</label>
              <input type="text" required placeholder="e.g. CS299" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
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
