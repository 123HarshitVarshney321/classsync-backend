import { describe, it, expect } from 'vitest'
import {
  toApiDate,
  parseApiDate,
  weekRange,
  formatWeekLabel,
  toHHmm,
  timeToMinutes,
  overlaps,
  blockPosition,
} from './dates.js'

describe('dates utils', () => {
  it('toApiDate returns local yyyy-MM-dd correctly', () => {
    const d = new Date(2026, 10, 15) // 15 Nov 2026
    expect(toApiDate(d)).toBe('2026-11-15')
  })

  it('toApiDate returns 2026-11-10 for new Date(2026, 10, 10, 0, 30)', () => {
    // 10 Nov 2026, 00:30 AM local time
    const d = new Date(2026, 10, 10, 0, 30)
    expect(toApiDate(d)).toBe('2026-11-10')
  })

  it('toApiDate returns empty string for null or undefined', () => {
    expect(toApiDate(null)).toBe('')
    expect(toApiDate(undefined)).toBe('')
  })

  it('parseApiDate parses yyyy-MM-dd into local midnight Date', () => {
    const d = parseApiDate('2026-11-10')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10) // 0-indexed November
    expect(d.getDate()).toBe(10)
    expect(parseApiDate(null)).toBeNull()
  })

  it('weekRange returns Monday to Sunday (7 days)', () => {
    // Wednesday 12 Nov 2026
    const wed = new Date(2026, 10, 12)
    const { start, end, days } = weekRange(wed)
    expect(toApiDate(start)).toBe('2026-11-09') // Monday
    expect(toApiDate(end)).toBe('2026-11-15') // Sunday
    expect(days).toHaveLength(7)
    expect(toApiDate(days[0])).toBe('2026-11-09')
    expect(toApiDate(days[6])).toBe('2026-11-15')
  })

  it('a Sunday belongs to the week starting the previous Monday', () => {
    // Sunday 15 Nov 2026
    const sunday = new Date(2026, 10, 15)
    const { start, end } = weekRange(sunday)
    expect(toApiDate(start)).toBe('2026-11-09')
    expect(toApiDate(end)).toBe('2026-11-15')
  })

  it('formatWeekLabel produces compact week range label', () => {
    const monday = new Date(2026, 10, 10)
    const label = formatWeekLabel(monday)
    // Week runs 9-15 Nov 2026
    expect(label).toContain('Nov 2026')
  })

  it('toHHmm formats HH:mm:ss to HH:mm and trims properly', () => {
    expect(toHHmm('09:00:00')).toBe('09:00')
    expect(toHHmm('14:30:15')).toBe('14:30')
    expect(toHHmm('11:00')).toBe('11:00')
    expect(toHHmm(null)).toBe('')
  })

  it('timeToMinutes converts HH:mm to minutes from midnight', () => {
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('08:00:00')).toBe(480)
    expect(timeToMinutes('20:00')).toBe(1200)
    expect(timeToMinutes('')).toBe(0)
  })

  it('overlaps returns false for back-to-back non-overlapping intervals', () => {
    // 10:00-11:00 vs 11:00-12:00
    expect(overlaps('10:00', '11:00', '11:00', '12:00')).toBe(false)
    expect(overlaps('11:00', '12:00', '10:00', '11:00')).toBe(false)
  })

  it('overlaps returns true for partial overlap', () => {
    // 10:00-11:30 vs 11:00-12:00
    expect(overlaps('10:00', '11:30', '11:00', '12:00')).toBe(true)
    // 10:30-11:00 vs 10:00-11:30
    expect(overlaps('10:30', '11:00', '10:00', '11:30')).toBe(true)
  })

  it('blockPosition calculates correct percentages inside 08:00-20:00 (480-1200 min)', () => {
    // 08:00 to 11:00 -> start = 0%, size = 3/12 = 25%
    const pos = blockPosition('08:00', '11:00')
    expect(pos.startPercent).toBe(0)
    expect(pos.sizePercent).toBe(25)
  })

  it('blockPosition clamps properly to day boundaries', () => {
    // 07:00 to 09:00 -> clamped start = 08:00, size = 1/12 = 8.333%
    const posStart = blockPosition('07:00', '09:00')
    expect(posStart.startPercent).toBe(0)
    expect(posStart.sizePercent).toBeCloseTo(8.333, 2)

    // 19:00 to 21:00 -> clamped end = 20:00, size = 1/12 = 8.333%
    const posEnd = blockPosition('19:00', '21:00')
    expect(posEnd.sizePercent).toBeCloseTo(8.333, 2)

    // completely outside: 06:00 to 07:00
    const posOutside = blockPosition('06:00', '07:00')
    expect(posOutside.sizePercent).toBe(0)
  })
})
