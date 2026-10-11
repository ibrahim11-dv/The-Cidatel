import { getAccessToken } from './storage'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { method = 'GET', body, authenticated = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  if (authenticated) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('The chess server is unavailable. Start the Spring Boot server and try again.', 0)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(payload?.message || 'The request could not be completed.', response.status)
  }
  return payload
}

export const authApi = {
  register({ username, email, password }) {
    return request('/auth/register', { method: 'POST', body: { username, email, password } })
  },
  login({ identifier, password }) {
    return request('/auth/login', { method: 'POST', body: { identifier, password } })
  },
}

export const accountApi = {
  me() {
    return request('/account/me', { authenticated: true })
  },
  updateIdentity({ username, email }) {
    return request('/account/me', { method: 'PUT', body: { username, email }, authenticated: true })
  },
  changePassword({ currentPassword, newPassword }) {
    return request('/account/me/password', { method: 'PUT', body: { currentPassword, newPassword }, authenticated: true })
  },
  updateAppearance({ boardTheme, pieceStyle, pieceTone }) {
    return request('/account/me/appearance', { method: 'PUT', body: { boardTheme, pieceStyle, pieceTone }, authenticated: true })
  },
}

export { ApiError }
