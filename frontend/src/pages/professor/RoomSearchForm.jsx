const ROOM_TYPES = [
  { value: 'CLASSROOM', label: 'Classroom' },
  { value: 'LAB', label: 'Lab' },
  { value: 'LECTURE_HALL', label: 'Lecture hall' },
  { value: 'SEMINAR_HALL', label: 'Seminar hall' },
]

export default function RoomSearchForm({
  date,
  setDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  capacity,
  setCapacity,
  complexId,
  setComplexId,
  roomType,
  setRoomType,
  selectedFacilities,
  onFacilityToggle,
  complexes,
  facilities,
  searching,
  onSearch,
}) {
  return (
    <form onSubmit={onSearch} className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Date *</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Start Time *</label>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">End Time *</label>
          <input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Capacity</label>
          <input
            type="number"
            min="1"
            placeholder="Min seats"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Complex</label>
          <select
            value={complexId}
            onChange={(e) => setComplexId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="">All Complexes</option>
            {complexes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Room Type</label>
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="">All Types</option>
            {ROOM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {facilities.length > 0 && (
        <div>
          <span className="block text-xs font-semibold text-gray-700 uppercase mb-2">Required Equipment</span>
          <div className="flex flex-wrap gap-2">
            {facilities.map((fac) => {
              const checked = selectedFacilities.includes(fac.id)
              return (
                <label
                  key={fac.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs border cursor-pointer select-none transition-colors ${
                    checked
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onFacilityToggle(fac.id)}
                    className="sr-only"
                  />
                  <span>{fac.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={searching}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-xs disabled:opacity-50 transition-colors"
        >
          {searching ? 'Finding available rooms...' : 'Find Rooms'}
        </button>
      </div>
    </form>
  )
}

