export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

function buildUrl(path, query) {
  if (!query) return path
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value)
    }
  }
  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

export async function request(method, path, { body, query } = {}) {
  const url = buildUrl(path, query)
  const options = {
    method,
    headers: {},
  }

  if (body !== undefined && body !== null) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(url, options)
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running on port 8080?')
  }

  if (response.status === 401) {
    if (path !== '/api/auth/login' && path !== '/api/auth/me') {
      if (typeof unauthorizedHandler === 'function') {
        unauthorizedHandler()
      }
    }
  }

  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const status = response.status
    let message = data && data.message ? data.message : null

    if (!message) {
      if (status === 401) message = 'Invalid email or password'
      else if (status === 403) message = "You don't have permission to do that."
      else if (status === 404) message = 'Requested resource not found'
      else if (status === 409) message = 'A conflict occurred'
      else if (status >= 500) message = 'Internal server error'
      else message = `Request failed with status ${status}`
    }

    throw new ApiError(status, message, data)
  }

  return data
}
