import { useState, useEffect } from 'react'
import { addDays, differenceInDays } from 'date-fns'
import {
  apiGetTimetableVersions,
  apiGenerateOccurrences,
} from '../../api/endpoints.js'
import { toApiDate, toHHmm, parseApiDate } from '../../utils/dates.js'
import Alert from '../../components/Alert.jsx'
import Loading from '../../components/Loading.jsx'

export default function GeneratePage() {
  const [versions, setVersions] = useState([])
  const [selectedVersionId, setSelectedVersionId] = useState('')
  const [startDate, setStartDate] = useState(toApiDate(new Date()))
  const [endDate, setEndDate] = useState(toApiDate(addDays(new Date(), 6)))

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [alertInfo, setAlertInfo] = useState(null)
  const [generationResult, setGenerationResult] = useState(null)

  useEffect(() => {
    apiGetTimetableVersions()
      .then((data) => {
        const active = (data || []).filter((v) => v.status === 'ACTIVE')
        setVersions(active)
        if (active.length > 0) {
          setSelectedVersionId(String(active[0].id))
        }
      })
      .catch((err) => {
        setAlertInfo({ type: 'error', message: err.message || 'Failed to load timetable versions.' })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setAlertInfo(null)
    setGenerationResult(null)

    if (!selectedVersionId) {
      setAlertInfo({ type: 'error', message: 'Please select an active timetable version.' })
      return
    }

    if (!startDate || !endDate) {
      setAlertInfo({ type: 'error', message: 'Start date and end date are required.' })
      return
    }

    const start = parseApiDate(startDate)
    const end = parseApiDate(endDate)

    if (end < start) {
      setAlertInfo({ type: 'error', message: 'End date must be on or after start date.' })
      return
    }

    const daysDiff = differenceInDays(end, start)
    if (daysDiff > 366) {
      setAlertInfo({ type: 'error', message: 'The generation window can be at most 12 months.' })
      return
    }

    setGenerating(true)
    try {
      const res = await apiGenerateOccurrences({
        timetableVersionId: Number(selectedVersionId),
        startDate,
        endDate,
      })
      setGenerationResult(res)
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Occurrence generation failed.' })
    } finally {
      setGenerating(false)
    }
  }

  const formatProblem = (conflict) => {
    if (conflict.type === 'ROOM_INACTIVE') {
      return 'Room or its complex is inactive'
    }
    if (conflict.type === 'PROFESSOR_BUSY') {
      return `Professor already teaching ${conflict.conflictingCourseCode || ''}`
    }
    if (conflict.type === 'ROOM_BUSY') {
      const typeLabel = conflict.conflictingEventType === 'OFFICIAL' ? 'Official' : 'Extra'
      return `Room already has ${conflict.conflictingCourseCode || ''} (${typeLabel})`
    }
    return conflict.type
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Generate Dated Classes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Project weekly master timetable entries onto specific calendar dates with conflict detection.
        </p>
      </div>

      {alertInfo && <Alert type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo(null)} />}

      {loading ? (
        <Loading message="Checking active timetable versions..." />
      ) : versions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          <p className="font-semibold text-base">No active timetable versions found.</p>
          <p className="text-sm text-gray-500 mt-1">
            You must activate a DRAFT timetable version first before generating dated occurrences.
          </p>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="bg-white p-6 rounded-lg border border-gray-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Active Version *
              </label>
              <select
                required
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.academicYear} Sem {v.semester} (v{v.versionNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={generating}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-xs disabled:opacity-50 transition-colors"
            >
              {generating ? 'Generating Classes...' : 'Generate Occurrences'}
            </button>
          </div>
        </form>
      )}

      {generating && <Loading message="Projecting calendar occurrences and evaluating conflicts..." />}

      {/* Generation Result Section */}
      {generationResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Generation Summary</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Window: {generationResult.startDate} to {generationResult.endDate}
            </p>
          </div>

          {/* Three Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-700">{generationResult.createdCount}</div>
              <div className="text-xs font-semibold text-emerald-800 uppercase mt-1">Created</div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-700">{generationResult.skippedExistingCount}</div>
              <div className="text-xs font-semibold text-gray-600 uppercase mt-1">Already existed</div>
            </div>

            <div className={`p-4 rounded-lg border text-center ${
              generationResult.conflictCount > 0
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <div className="text-2xl font-bold">{generationResult.conflictCount}</div>
              <div className="text-xs font-semibold uppercase mt-1">Conflicts</div>
            </div>
          </div>

          {/* Conflict Details Table */}
          {generationResult.conflicts && generationResult.conflicts.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-gray-900">Conflict Report</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Date</th>
                      <th className="px-4 py-2.5 text-left">Time</th>
                      <th className="px-4 py-2.5 text-left">Course</th>
                      <th className="px-4 py-2.5 text-left">Room</th>
                      <th className="px-4 py-2.5 text-left">Professor</th>
                      <th className="px-4 py-2.5 text-left">Problem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {generationResult.conflicts.map((c, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{c.date}</td>
                        <td className="px-4 py-2 font-mono text-gray-700">
                          {toHHmm(c.startTime)}–{toHHmm(c.endTime)}
                        </td>
                        <td className="px-4 py-2 font-semibold text-gray-900">{c.courseCode}</td>
                        <td className="px-4 py-2 text-gray-700">Room {c.roomNumber}</td>
                        <td className="px-4 py-2 text-gray-700">{c.professorName}</td>
                        <td className="px-4 py-2 text-rose-700 font-medium">{formatProblem(c)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 italic pt-2">
            Running generation again only fills gaps — after fixing a conflict, run it again for the same dates.
          </p>
        </div>
      )}
    </div>
  )
}
