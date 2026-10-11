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

export const gameApi = {
  matchmaking: (seconds, increment) => request('/games/matchmaking', { method: 'POST', body: { seconds, increment }, authenticated: true }),
  cancelMatchmaking: () => request('/games/matchmaking', { method: 'DELETE', authenticated: true }),
  active: () => request('/games/active', { authenticated: true }),
  offerDraw: (id) => request(`/games/${encodeURIComponent(id)}/draw/offer`, { method: 'POST', authenticated: true }),
  respondToDraw: (id, accept) => request(`/games/${encodeURIComponent(id)}/draw/${accept ? 'accept' : 'decline'}`, { method: 'POST', authenticated: true }),
  create: (seconds, increment) => request('/games/invitations', { method: 'POST', authenticated: true, body: { seconds, increment } }),
  invitation: (code) => request(`/games/invitations/${encodeURIComponent(code)}`, { authenticated: true }),
  cancel: (code) => request(`/games/invitations/${encodeURIComponent(code)}`, { method: 'DELETE', authenticated: true }),
  join: (code) => request(`/games/invitations/${encodeURIComponent(code)}/join`, { method: 'POST', authenticated: true }),
  state: (id) => request(`/games/${encodeURIComponent(id)}`, { authenticated: true }),
  move: (id, body) => request(`/games/${encodeURIComponent(id)}/moves`, { method: 'POST', body, authenticated: true }),
  resign: (id) => request(`/games/${encodeURIComponent(id)}/resign`, { method: 'POST', authenticated: true }),
}
