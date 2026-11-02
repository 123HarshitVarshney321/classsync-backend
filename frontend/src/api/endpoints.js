import { request } from './client.js'

// Auth endpoints
export function apiLogin(email, password) {
  return request('POST', '/api/auth/login', { body: { email, password } })
}

export function apiGetMe() {
  return request('GET', '/api/auth/me')
}

export function apiLogout() {
  return request('POST', '/api/auth/logout')
}

// Schedule Occurrences
export function apiGetOccurrences(filters = {}) {
  return request('GET', '/api/schedule-occurrences', { query: filters })
}

export function apiGetOccurrence(id) {
  return request('GET', `/api/schedule-occurrences/${id}`)
}

export function apiGenerateOccurrences(body) {
  return request('POST', '/api/schedule-occurrences/generate', { body })
}

// Room Recommendations
export function apiGetRecommendations(params) {
  return request('GET', '/api/rooms/recommendations', { query: params })
}

// Bookings & Classes
export function apiCreateBooking(body) {
  return request('POST', '/api/bookings', { body })
}

export function apiCancelClass(id) {
  return request('POST', `/api/classes/${id}/cancel`)
}

export function apiRescheduleClass(id, body) {
  return request('POST', `/api/classes/${id}/reschedule`, { body })
}

// Complexes
export function apiGetComplexes(includeInactive = false) {
  return request('GET', '/api/complexes', {
    query: includeInactive ? { includeInactive: true } : {},
  })
}

export function apiCreateComplex(body) {
  return request('POST', '/api/complexes', { body })
}

export function apiUpdateComplex(id, body) {
  return request('PUT', `/api/complexes/${id}`, { body })
}

export function apiUpdateComplexStatus(id, active) {
  return request('PATCH', `/api/complexes/${id}/status`, { body: { active } })
}

export function apiGetComplexRooms(complexId, includeInactive = false) {
  return request('GET', `/api/complexes/${complexId}/rooms`, {
    query: includeInactive ? { includeInactive: true } : {},
  })
}

export function apiCreateRoom(complexId, body) {
  return request('POST', `/api/complexes/${complexId}/rooms`, { body })
}

// Rooms
export function apiGetRoom(id, includeInactive = false) {
  return request('GET', `/api/rooms/${id}`, {
    query: includeInactive ? { includeInactive: true } : {},
  })
}

export function apiUpdateRoom(id, body) {
  return request('PUT', `/api/rooms/${id}`, { body })
}

export function apiUpdateRoomStatus(id, active) {
  return request('PATCH', `/api/rooms/${id}/status`, { body: { active } })
}

// Facilities
export function apiGetFacilities(includeInactive = false) {
  return request('GET', '/api/facilities', {
    query: includeInactive ? { includeInactive: true } : {},
  })
}

export function apiCreateFacility(body) {
  return request('POST', '/api/facilities', { body })
}

export function apiUpdateFacility(id, body) {
  return request('PUT', `/api/facilities/${id}`, { body })
}

export function apiUpdateFacilityStatus(id, active) {
  return request('PATCH', `/api/facilities/${id}/status`, { body: { active } })
}

// Users (Admin only)
export function apiGetUsers(query = {}) {
  return request('GET', '/api/users', { query })
}

// Timetables
export function apiGetTimetableVersions(query = {}) {
  return request('GET', '/api/timetables/versions', { query })
}

export function apiCreateTimetableVersion(body) {
  return request('POST', '/api/timetables/versions', { body })
}

export function apiActivateTimetableVersion(id, effectiveFrom = null) {
  return request('PATCH', `/api/timetables/versions/${id}/activate`, {
    query: effectiveFrom ? { effectiveFrom } : {},
  })
}

export function apiArchiveTimetableVersion(id) {
  return request('PATCH', `/api/timetables/versions/${id}/archive`)
}

export function apiGetTimetableEntries(versionId) {
  return request('GET', `/api/timetables/versions/${versionId}/entries`)
}

export function apiCreateTimetableEntry(versionId, body) {
  return request('POST', `/api/timetables/versions/${versionId}/entries`, { body })
}

export function apiUpdateTimetableEntry(entryId, body) {
  return request('PUT', `/api/timetables/entries/${entryId}`, { body })
}

export function apiDeleteTimetableEntry(entryId) {
  return request('DELETE', `/api/timetables/entries/${entryId}`)
}
