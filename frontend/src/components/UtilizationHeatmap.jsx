import { heatColorClass } from '../utils/heatmap.js'

const DAY_LABELS = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8)

export default function UtilizationHeatmap({ heatmap = [] }) {
  const allPercents = heatmap.flatMap((row) => row.cells?.map((c) => c.utilizationPercent) || [])
  const maxPercent = allPercents.length > 0 ? Math.max(...allPercents, 0) : 0

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Peak hours — share of rooms busy</h3>
        <p className="text-xs text-gray-500 mt-1">Colours are relative to the busiest hour in this selection.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-center text-xs border-collapse">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-medium text-gray-500 bg-gray-50 border border-gray-200">Day</th>
              {HOURS.map((h) => (
                <th key={h} className="py-2 px-2 font-medium text-gray-500 bg-gray-50 border border-gray-200">
                  {h.toString().padStart(2, '0')}:00
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.map((row) => (
              <tr key={row.day}>
                <td className="py-2 px-3 text-left font-medium text-gray-700 bg-gray-50 border border-gray-200 whitespace-nowrap">
                  {DAY_LABELS[row.day] || row.day}
                </td>
                {HOURS.map((h) => {
                  const cell = row.cells?.find((c) => c.hour === h)
                  const percent = cell ? cell.utilizationPercent : 0
                  const colorClass = heatColorClass(percent, maxPercent)
                  return (
                    <td
                      key={h}
                      className={`py-2 px-1 border border-gray-200 font-medium tabular-nums ${colorClass}`}
                      title={`${DAY_LABELS[row.day] || row.day} ${h}:00 - ${percent}% busy`}
                    >
                      {percent.toFixed(1)}%
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 text-xs text-gray-500 pt-2">
        <span>0%</span>
        <span className="inline-block w-4 h-4 bg-gray-50 border border-gray-200" />
        <span className="inline-block w-4 h-4 bg-blue-100" />
        <span className="inline-block w-4 h-4 bg-blue-200" />
        <span className="inline-block w-4 h-4 bg-blue-400" />
        <span className="inline-block w-4 h-4 bg-blue-600" />
        <span>Busiest ({maxPercent.toFixed(1)}%)</span>
      </div>
    </div>
  )
}
