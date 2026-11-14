import { describe, it, expect } from 'vitest'
import { heatColorClass } from './heatmap.js'

describe('heatColorClass', () => {
  it('returns muted gray class when percent is 0', () => {
    expect(heatColorClass(0, 100)).toBe('bg-gray-50 text-gray-400')
  })

  it('returns muted gray class when maxPercent is 0', () => {
    expect(heatColorClass(50, 0)).toBe('bg-gray-50 text-gray-400')
  })

  it('returns bg-blue-100 when ratio is <= 0.25', () => {
    expect(heatColorClass(25, 100)).toBe('bg-blue-100')
    expect(heatColorClass(10, 100)).toBe('bg-blue-100')
  })

  it('returns bg-blue-200 when ratio is > 0.25 and <= 0.5', () => {
    expect(heatColorClass(50, 100)).toBe('bg-blue-200')
    expect(heatColorClass(30, 100)).toBe('bg-blue-200')
  })

  it('returns bg-blue-400 text-white when ratio is > 0.5 and <= 0.75', () => {
    expect(heatColorClass(75, 100)).toBe('bg-blue-400 text-white')
    expect(heatColorClass(60, 100)).toBe('bg-blue-400 text-white')
  })

  it('returns bg-blue-600 text-white when ratio is > 0.75', () => {
    expect(heatColorClass(76, 100)).toBe('bg-blue-600 text-white')
    expect(heatColorClass(100, 100)).toBe('bg-blue-600 text-white')
  })
})
