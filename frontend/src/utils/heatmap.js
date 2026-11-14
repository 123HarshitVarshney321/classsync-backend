export function heatColorClass(percent, maxPercent) {
  if (!percent || !maxPercent || percent <= 0 || maxPercent <= 0) {
    return 'bg-gray-50 text-gray-400'
  }
  const ratio = percent / maxPercent
  if (ratio <= 0.25) {
    return 'bg-blue-100'
  }
  if (ratio <= 0.5) {
    return 'bg-blue-200'
  }
  if (ratio <= 0.75) {
    return 'bg-blue-400 text-white'
  }
  return 'bg-blue-600 text-white'
}
