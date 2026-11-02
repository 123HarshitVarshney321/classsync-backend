import { format } from 'date-fns'
import { toApiDate, toHHmm, blockPosition } from '../utils/dates.js'

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

export default function WeekCalendar({
  days,
  occurrences = [],
  showCancelled = true,
  onSelectOccurrence,
}) {
  const visibleOccurrences = occurrences.filter((occ) => {
    if (!showCancelled && occ.status !== 'SCHEDULED') return false
    return true
  })

  // Group occurrences by scheduleDate
  const occurrencesByDate = {}
  for (const day of days) {
    const key = toApiDate(day)
    occurrencesByDate[key] = []
  }

  for (const occ of visibleOccurrences) {
    const key = occ.scheduleDate
    if (occurrencesByDate[key]) {
      occurrencesByDate[key].push(occ)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header: 7 Days */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
          <div className="p-3 text-center border-r border-gray-200">Time</div>
          {days.map((day) => {
            const dateStr = toApiDate(day)
            const isToday = toApiDate(new Date()) === dateStr
            return (
              <div
                key={dateStr}
                className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                  isToday ? 'bg-blue-50/70 text-blue-800' : ''
                }`}
              >
                <div>{format(day, 'EEE')}</div>
                <div className={`text-sm mt-0.5 ${isToday ? 'font-bold' : ''}`}>
                  {format(day, 'd MMM')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Calendar Body with Time Rows */}
        <div className="relative grid grid-cols-[60px_repeat(7,1fr)] h-[660px]">
          {/* Time axis */}
          <div className="border-r border-gray-200 relative select-none">
            {HOURS.map((hour, idx) => {
              if (idx === HOURS.length - 1) return null
              return (
                <div
                  key={hour}
                  className="absolute w-full text-right pr-2 text-[11px] font-mono text-gray-400"
                  style={{ top: `${(idx / (HOURS.length - 1)) * 100}%` }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              )
            })}
          </div>

          {/* 7 Columns */}
          {days.map((day) => {
            const dateKey = toApiDate(day)
            const dayOccurrences = occurrencesByDate[dateKey] || []

            return (
              <div
                key={dateKey}
                className="relative border-r border-gray-200 last:border-r-0 h-full"
              >
                {/* Hour background guide lines */}
                {HOURS.map((hour, idx) => {
                  if (idx === 0) return null
                  return (
                    <div
                      key={hour}
                      className="absolute w-full border-t border-gray-100"
                      style={{ top: `${((idx) / (HOURS.length - 1)) * 100}%` }}
                    />
                  )
                })}

                {/* Occurrence blocks */}
                {dayOccurrences.map((occ) => {
                  const { startPercent, sizePercent } = blockPosition(
                    occ.startTime,
                    occ.endTime,
                    480,
                    1200,
                  )

                  if (sizePercent <= 0) return null

                  const isScheduled = occ.status === 'SCHEDULED'
                  const isOfficial = occ.eventType === 'OFFICIAL'
                  const isReplacement = Boolean(occ.rescheduledFromId)

                  let blockStyle =
                    'z-10 opacity-60 bg-gray-100 text-gray-500 border-gray-300'
                  if (isScheduled) {
                    blockStyle = isOfficial
                      ? 'z-20 bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100'
                      : 'z-20 bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  }

                  const statusLabel =
                    occ.status === 'CANCELLED'
                      ? 'Cancelled'
                      : occ.status === 'RESCHEDULED'
                      ? 'Rescheduled'
                      : occ.status === 'SUPERSEDED'
                      ? 'Superseded'
                      : null

                  return (
                    <button
                      type="button"
                      key={occ.id}
                      onClick={() => onSelectOccurrence && onSelectOccurrence(occ)}
                      className={`absolute inset-x-1 border rounded p-1.5 text-left text-xs overflow-hidden transition-all shadow-xs cursor-pointer ${blockStyle}`}
                      style={{
                        top: `${startPercent}%`,
                        height: `${sizePercent}%`,
                      }}
                      title={`${occ.courseCode} (${toHHmm(occ.startTime)}–${toHHmm(
                        occ.endTime,
                      )}) in Room ${occ.room?.roomNumber || ''}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-bold truncate ${!isScheduled ? 'line-through' : ''}`}>
                          {occ.courseCode}
                        </span>
                        {isReplacement && isScheduled && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1 rounded">
                            Moved
                          </span>
                        )}
                        {statusLabel && (
                          <span className="bg-gray-200 text-gray-700 text-[10px] px-1 rounded">
                            {statusLabel}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] truncate mt-0.5">
                        Room {occ.room?.roomNumber}
                      </div>

                      <div className="text-[10px] opacity-75 font-mono">
                        {toHHmm(occ.startTime)}–{toHHmm(occ.endTime)}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
