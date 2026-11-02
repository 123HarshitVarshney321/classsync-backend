import { describe, it, expect, vi, beforeEach } from 'vitest'
import { request, setUnauthorizedHandler, ApiError } from './client.js'

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setUnauthorizedHandler(null)
  })

  it('returns parsed JSON for successful 200 OK response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 1, name: 'Test' }),
    })

    const result = await request('GET', '/api/test')
    expect(result).toEqual({ id: 1, name: 'Test' })
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {},
    })
  })

  it('builds query parameters skipping empty/null/undefined values', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    })

    await request('GET', '/api/rooms', {
      query: { active: true, complex: null, empty: '', cap: 50 },
    })

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/rooms?active=true&cap=50', {
      method: 'GET',
      headers: {},
    })
  })

  it('sends JSON Content-Type and stringified body for POST requests', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    })

    const payload = { roomNumber: '101', capacity: 30 }
    await request('POST', '/api/rooms', { body: payload })

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('returns null for 204 No Content response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => '',
    })

    const result = await request('POST', '/api/auth/logout')
    expect(result).toBeNull()
  })

  it('throws ApiError taking error message from response body', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({
          status: 409,
          error: 'Conflict',
          message: 'Room is already scheduled for the requested time.',
        }),
    })

    await expect(request('POST', '/api/bookings')).rejects.toThrow(ApiError)
    try {
      await request('POST', '/api/bookings')
    } catch (err) {
      expect(err.status).toBe(409)
      expect(err.message).toBe('Room is already scheduled for the requested time.')
    }
  })

  it('throws ApiError with network error message when fetch is rejected', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))

    await expect(request('GET', '/api/health')).rejects.toThrow(
      'Cannot reach the server. Is the backend running on port 8080?',
    )
  })

  it('calls onUnauthorized handler on 401 for normal endpoints', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Unauthorized' }),
    })

    await expect(request('GET', '/api/schedule-occurrences')).rejects.toThrow()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onUnauthorized handler on 401 for /api/auth/me or /api/auth/login', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Unauthorized' }),
    })

    // /api/auth/me
    await expect(request('GET', '/api/auth/me')).rejects.toThrow()
    expect(handler).not.toHaveBeenCalled()

    // /api/auth/login
    await expect(request('POST', '/api/auth/login', { body: {} })).rejects.toThrow()
    expect(handler).not.toHaveBeenCalled()
  })
})
