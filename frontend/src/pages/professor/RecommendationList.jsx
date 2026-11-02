const ROOM_TYPES = [
  { value: 'CLASSROOM', label: 'Classroom' },
  { value: 'LAB', label: 'Lab' },
  { value: 'LECTURE_HALL', label: 'Lecture hall' },
  { value: 'SEMINAR_HALL', label: 'Seminar hall' },
]

export default function RecommendationList({
  results,
  rescheduleOccurrence,
  onSelectRoom,
}) {
  if (!results) return null

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Recommended Rooms ({results.length})
        </h2>
        <span className="text-xs text-gray-500">Sorted by fit score</span>
      </div>

      {results.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <p className="font-semibold text-base">No rooms available matching your criteria.</p>
          <p className="text-sm text-gray-400 mt-1">
            You may already have a class scheduled during this time, or all suitable rooms are occupied.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((item, index) => {
            const { room, score, reasons } = item
            const scorePercent = Math.min(100, Math.max(0, Math.round(score)))
            return (
              <div
                key={room.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      Room {room.roomNumber}
                    </span>
                    <span className="text-sm text-gray-600 font-medium">
                      {room.complexName}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {ROOM_TYPES.find((t) => t.value === room.roomType)?.label || room.roomType}
                    </span>
                    <span className="text-xs text-gray-500">
                      Cap: {room.capacity}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 max-w-xs">
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-10">
                      {scorePercent}%
                    </span>
                  </div>

                  {reasons && reasons.length > 0 && (
                    <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
                      {reasons.map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  {rescheduleOccurrence ? (
                    <button
                      type="button"
                      onClick={() => onSelectRoom(room)}
                      className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-md shadow-xs transition-colors"
                    >
                      Move here
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectRoom(room)}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-xs transition-colors"
                    >
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
  )
}

