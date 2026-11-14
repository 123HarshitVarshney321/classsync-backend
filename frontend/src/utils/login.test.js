import { describe, it, expect } from 'vitest'
import { toLoginEmail, DEFAULT_EMAIL_DOMAIN } from './login.js'

describe('toLoginEmail', () => {
  it('converts username to default domain email', () => {
    expect(toLoginEmail('admin')).toBe(`admin@${DEFAULT_EMAIL_DOMAIN}`)
  })

  it('keeps full email unchanged', () => {
    expect(toLoginEmail('aturing@classsync.edu')).toBe('aturing@classsync.edu')
  })

  it('trims and lowercases input with mixed case and spaces', () => {
    expect(toLoginEmail('  ATuring@ClassSync.edu ')).toBe('aturing@classsync.edu')
  })

  it('returns empty string for empty input', () => {
    expect(toLoginEmail('')).toBe('')
    expect(toLoginEmail('   ')).toBe('')
    expect(toLoginEmail(null)).toBe('')
    expect(toLoginEmail(undefined)).toBe('')
  })
})
