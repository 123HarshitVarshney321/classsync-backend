import Modal from '../../components/Modal.jsx'

// eslint-disable-next-line react-refresh/only-export-components
export const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

export default function EntryFormModal({
  isOpen,
  onClose,
  modalMode,
  entryForm,
  setEntryForm,
  professors,
  activeRooms,
  saving,
  onSave,
}) {
  if (!isOpen) return null

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={modalMode === 'add' ? 'Add Master Timetable Entry' : 'Edit Timetable Entry'}
    >
      <form onSubmit={onSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Course Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS101"
              value={entryForm.courseCode}
              onChange={(e) => setEntryForm({ ...entryForm, courseCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Course Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Intro to Computing"
              value={entryForm.courseName}
              onChange={(e) => setEntryForm({ ...entryForm, courseName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Professor *
          </label>
          <select
            required
            value={entryForm.professorId}
            onChange={(e) => setEntryForm({ ...entryForm, professorId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="">Select Professor</option>
            {professors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Room *
          </label>
          <select
            required
            value={entryForm.roomId}
            onChange={(e) => setEntryForm({ ...entryForm, roomId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="">Select Room</option>
            {activeRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roomNumber} ({r.complexName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Day of Week *
          </label>
          <select
            value={entryForm.dayOfWeek}
            onChange={(e) => setEntryForm({ ...entryForm, dayOfWeek: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Start Time *
            </label>
            <input
              type="time"
              required
              value={entryForm.startTime}
              onChange={(e) => setEntryForm({ ...entryForm, startTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              End Time *
            </label>
            <input
              type="time"
              required
              value={entryForm.endTime}
              onChange={(e) => setEntryForm({ ...entryForm, endTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
