export default function StatusBadge({ status, className = '' }) {
  if (!status) return null

  const s = String(status).toUpperCase()

  let style = 'bg-gray-100 text-gray-800 border-gray-200'

  if (s === 'ACTIVE' || s === 'SCHEDULED') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  } else if (s === 'DRAFT') {
    style = 'bg-amber-50 text-amber-700 border-amber-200'
  } else if (s === 'CANCELLED') {
    style = 'bg-rose-50 text-rose-700 border-rose-200'
  } else if (s === 'RESCHEDULED') {
    style = 'bg-orange-50 text-orange-700 border-orange-200'
  } else if (s === 'SUPERSEDED' || s === 'ARCHIVED' || s === 'INACTIVE') {
    style = 'bg-gray-100 text-gray-600 border-gray-200'
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style} ${className}`}
    >
      {s}
    </span>
  )
}
