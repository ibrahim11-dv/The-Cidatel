import { getAccessToken } from './storage.js'

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

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    const payload = await response.json().catch((error) => {
      if (controller.signal.aborted) throw error
      return null
    })
    if (!response.ok) throw new ApiError(payload?.message || (response.status >= 500
      ? 'The server encountered a problem. Reconnect to check whether your action was received.'
      : 'The request could not be completed.'), response.status)
    return payload
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(controller.signal.aborted
      ? 'The server took too long to respond. Reconnect to check whether your action was received.'
      : 'The chess server is unavailable. Check your connection and try again.', 0)
  } finally {
    clearTimeout(timeout)
  }
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
  updateAppearance({ boardTheme, pieceStyle, pieceTone, siteTheme, customColors }) {
    return request('/account/me/appearance', { method: 'PUT', body: { boardTheme, pieceStyle, pieceTone, siteTheme, customColors }, authenticated: true })
  },
}

export const puzzleApi = {
  progress: () => request('/puzzles/progress', { authenticated: true }),
  saveProgress: (progress) => request('/puzzles/progress', { method: 'PUT', body: progress, authenticated: true }),
}

export { ApiError }

export const gameApi = {
  lobby: () => request('/games/lobby', { authenticated: true }),
  claimDraw: (id, expectedPly, intendedMove) => request(`/games/${encodeURIComponent(id)}/draw/claim`, { method: 'POST', body: { expectedPly, intendedMove: intendedMove || null }, authenticated: true }),
  players: (id) => request(`/games/${encodeURIComponent(id)}/players`, { authenticated: true }),
  rematchStatus: (id) => request(`/games/${encodeURIComponent(id)}/rematch`, { authenticated: true }),
  requestRematch: (id) => request(`/games/${encodeURIComponent(id)}/rematch`, { method: 'POST', authenticated: true }),
  cancelRematch: (id) => request(`/games/${encodeURIComponent(id)}/rematch`, { method: 'DELETE', authenticated: true }),
  matchmaking: (seconds, increment) => request('/games/matchmaking', { method: 'POST', body: { seconds, increment }, authenticated: true }),
  cancelMatchmaking: () => request('/games/matchmaking', { method: 'DELETE', authenticated: true }),
  active: () => request('/games/active', { authenticated: true }),
  history: () => request('/games/history', { authenticated: true }),
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
