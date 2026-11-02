import { addDays } from 'date-fns'
import { formatWeekLabel } from '../utils/dates.js'

export default function WeekNavigator({ currentDate, onDateChange }) {
  const handlePrev = () => {
    onDateChange(addDays(currentDate, -7))
  }

  const handleNext = () => {
    onDateChange(addDays(currentDate, 7))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-md border border-gray-300 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={handlePrev}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-300 transition-colors"
          title="Previous week"
        >
          &larr; Prev
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border-r border-gray-300 transition-colors"
          title="Current week"
        >
          This week
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          title="Next week"
        >
          Next &rarr;
        </button>
      </div>

      <span className="text-base font-semibold text-gray-800">
        {formatWeekLabel(currentDate)}
      </span>
    </div>
  )
}
