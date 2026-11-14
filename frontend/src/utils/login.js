export const DEFAULT_EMAIL_DOMAIN = 'classsync.edu'

export function toLoginEmail(input) {
  if (!input) return ''
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return ''
  if (trimmed.includes('@')) return trimmed
  return `${trimmed}@${DEFAULT_EMAIL_DOMAIN}`
}
