import { toHHmm, blockPosition } from '../utils/dates.js'

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

const ROOM_TYPE_LABELS = {
  CLASSROOM: 'Classroom',
  LAB: 'Lab',
  LECTURE_HALL: 'Lecture hall',
  SEMINAR_HALL: 'Seminar hall',
}

export default function OccupancyGrid({ groupedRooms, occurrences = [] }) {
  // Map occurrences by roomId
  const occurrencesByRoom = {}
  for (const occ of occurrences) {
    if (occ.status !== 'SCHEDULED') continue
    const rId = occ.room?.id
    if (!rId) continue
    if (!occurrencesByRoom[rId]) occurrencesByRoom[rId] = []
    occurrencesByRoom[rId].push(occ)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-x-auto">
      {/* Legend */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-6 text-xs text-gray-700">
        <span className="font-semibold text-gray-900">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 bg-blue-100 border border-blue-300 rounded" />
          <span>Official Class</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 bg-emerald-100 border border-emerald-300 rounded" />
          <span>Extra Booking</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 bg-white border border-gray-200 rounded" />
          <span>Available</span>
        </div>
      </div>

      <div className="min-w-[900px]">
        {/* Hours Header */}
        <div className="grid grid-cols-[220px_1fr] border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
          <div className="p-3 border-r border-gray-200">Room / Complex</div>
          <div className="relative h-10">
            {HOURS.map((hour, idx) => {
              if (idx === HOURS.length - 1) return null
              return (
                <div
                  key={hour}
                  className="absolute text-center text-[11px] font-mono text-gray-500 transform -translate-x-1/2"
                  style={{
                    left: `${(idx / (HOURS.length - 1)) * 100}%`,
                    top: '10px',
                  }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              )
            })}
          </div>
        </div>

        {/* Complex Groups & Rows */}
        {groupedRooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No active rooms found for the selected filter.
          </div>
        ) : (
          groupedRooms.map(({ complex, rooms }) => (
            <div key={complex.id} className="border-b border-gray-200 last:border-b-0">
              {/* Complex Header */}
              <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 tracking-wide uppercase border-b border-gray-200">
                {complex.name} ({complex.code})
              </div>

              {/* Rooms in this complex */}
              {rooms.map((room) => {
                const roomOccurrences = occurrencesByRoom[room.id] || []
                const typeLabel = ROOM_TYPE_LABELS[room.roomType] || room.roomType

                return (
                  <div
                    key={room.id}
                    className="grid grid-cols-[220px_1fr] border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
                  >
                    {/* Room Info */}
                    <div className="p-3 border-r border-gray-200 text-xs flex flex-col justify-center">
                      <div className="font-bold text-gray-900">Room {room.roomNumber}</div>
                      <div className="text-gray-500 text-[11px] mt-0.5">
                        {typeLabel} · Cap: {room.capacity}
                      </div>
                    </div>

                    {/* Timeline Grid */}
                    <div className="relative h-14 bg-white">
                      {/* Vertical Hour lines */}
                      {HOURS.map((hour, idx) => {
                        if (idx === 0) return null
                        return (
                          <div
                            key={hour}
                            className="absolute h-full border-r border-gray-100"
                            style={{ left: `${(idx / (HOURS.length - 1)) * 100}%` }}
                          />
                        )
                      })}

                      {/* Occurrences blocks */}
                      {roomOccurrences.map((occ) => {
                        const { startPercent, sizePercent } = blockPosition(
                          occ.startTime,
                          occ.endTime,
                          480,
                          1200,
                        )

                        if (sizePercent <= 0) return null

                        const isOfficial = occ.eventType === 'OFFICIAL'
                        const colorClass = isOfficial
                          ? 'bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200'
                          : 'bg-emerald-100 border-emerald-300 text-emerald-900 hover:bg-emerald-200'

                        const titleText = `${occ.courseCode} (${toHHmm(occ.startTime)}–${toHHmm(
                          occ.endTime,
                        )}): ${occ.courseName || ''} - Prof. ${occ.professor?.name || ''}`

                        return (
                          <div
                            key={occ.id}
                            title={titleText}
                            className={`absolute top-1.5 bottom-1.5 rounded px-2 py-1 text-xs font-medium border truncate overflow-hidden cursor-default transition-colors ${colorClass}`}
                            style={{
                              left: `${startPercent}%`,
                              width: `${sizePercent}%`,
                            }}
                          >
                            <span className="font-bold">{occ.courseCode}</span>
                            {occ.professor?.name && (
                              <span className="ml-1 opacity-80 text-[11px]">
                                · {occ.professor.name}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
