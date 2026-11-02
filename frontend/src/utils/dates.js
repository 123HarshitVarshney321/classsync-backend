import { format, startOfWeek, addDays } from 'date-fns'

export function toApiDate(date) {
  if (!date) return ''
  return format(date, 'yyyy-MM-dd')
}

export function parseApiDate(str) {
  if (!str) return null
  const parts = String(str).split('-')
  if (parts.length !== 3) return null
  const [y, m, d] = parts.map(Number)
  return new Date(y, m - 1, d)
}

export function weekRange(date) {
  const d = typeof date === 'string' ? parseApiDate(date) : date
  const monday = startOfWeek(d, { weekStartsOn: 1 })
  const sunday = addDays(monday, 6)
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(monday, i))
  return { start: monday, end: sunday, days }
}

export function formatWeekLabel(date) {
  const { start, end } = weekRange(date)
  const startYear = format(start, 'yyyy')
  const endYear = format(end, 'yyyy')
  const startMonth = format(start, 'MMM')
  const endMonth = format(end, 'MMM')

  if (startYear !== endYear) {
    return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`
  }
  if (startMonth !== endMonth) {
    return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
  }
  return `${format(start, 'd')}–${format(end, 'd MMM yyyy')}`
}

export function toHHmm(time) {
  if (!time) return ''
  return String(time).slice(0, 5)
}

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const clean = toHHmm(timeStr)
  const [h, m] = clean.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  const aS = typeof aStart === 'string' ? timeToMinutes(aStart) : aStart
  const aE = typeof aEnd === 'string' ? timeToMinutes(aEnd) : aEnd
  const bS = typeof bStart === 'string' ? timeToMinutes(bStart) : bStart
  const bE = typeof bEnd === 'string' ? timeToMinutes(bEnd) : bEnd
  return aS < bE && aE > bS
}

export function blockPosition(start, end, dayStart = 480, dayEnd = 1200) {
  const s = typeof start === 'string' ? timeToMinutes(start) : start
  const e = typeof end === 'string' ? timeToMinutes(end) : end

  const clampedStart = Math.max(dayStart, Math.min(dayEnd, s))
  const clampedEnd = Math.max(dayStart, Math.min(dayEnd, e))

  if (clampedEnd <= clampedStart) {
    return { startPercent: 0, sizePercent: 0 }
  }

  const total = dayEnd - dayStart
  const startPercent = ((clampedStart - dayStart) / total) * 100
  const sizePercent = ((clampedEnd - clampedStart) / total) * 100

  return { startPercent, sizePercent }
}
