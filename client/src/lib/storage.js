const KEYS = {
  session: 'walnut-chess:session',
  accessToken: 'walnut-chess:access-token',
  games: 'walnut-chess:games',
  puzzles: 'walnut-chess:puzzles',
}

export const DEFAULT_PREFERENCES = {
  boardTheme: 'walnut',
  siteTheme: 'walnut',
  pieceStyle: 'classic',
  pieceTone: 'ivory',
  customColors: {},
}

export function getGuestPreferences() {
  const saved = localRead('citadel:guest-pieces', {})
  return {
    ...DEFAULT_PREFERENCES,
    pieceStyle: ['classic', 'modern', 'manuscript'].includes(saved?.pieceStyle) ? saved.pieceStyle : 'classic',
    pieceTone: ['ivory', 'ebony', 'brass'].includes(saved?.pieceTone) ? saved.pieceTone : 'ivory',
  }
}

export function saveGuestPreferences(preferences) {
  // Let the caller report a failed save while retaining its in-memory preview.
  window.localStorage.setItem('citadel:guest-pieces', JSON.stringify(preferences))
}

function read(store, key, fallback) {
  try {
    const value = store.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function write(store, key, value) {
  try {
    store.setItem(key, JSON.stringify(value))
  } catch {
    // The interface remains usable when browser storage is unavailable.
  }
}

function localRead(key, fallback) {
  return read(window.localStorage, key, fallback)
}

function localWrite(key, value) {
  write(window.localStorage, key, value)
}

function sessionRead(key, fallback) {
  return read(window.sessionStorage, key, fallback)
}

function sessionWrite(key, value) {
  write(window.sessionStorage, key, value)
}

function sessionFromAccount(account) {
  return {
    id: account.id,
    displayName: account.username,
    username: account.username,
    email: account.email,
    preferences: { ...DEFAULT_PREFERENCES, ...account.preferences },
  }
}

export function getSession() {
  return sessionRead(KEYS.session, null)
}

export function getAccessToken() {
  try {
    return window.sessionStorage.getItem(KEYS.accessToken)
  } catch {
    return null
  }
}

export function saveAuthenticatedSession({ accessToken, user }) {
  const session = sessionFromAccount(user)
  sessionWrite(KEYS.session, session)
  try {
    window.sessionStorage.setItem(KEYS.accessToken, accessToken)
  } catch {
    // Requests can still use the in-memory session for the current screen.
  }
  return session
}

export function updateSavedSession(user) {
  const session = sessionFromAccount(user)
  sessionWrite(KEYS.session, session)
  return session
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(KEYS.session)
    window.sessionStorage.removeItem(KEYS.accessToken)
  } catch {
    // No action needed when storage is unavailable.
  }
}

export function getGames(ownerId) {
  return localRead(KEYS.games, []).filter((game) => game.ownerId === ownerId)
}

export function saveGame(game) {
  const games = localRead(KEYS.games, [])
  localWrite(KEYS.games, [game, ...games.filter((item) => item.id !== game.id)])
}

export function getPuzzleProgress(ownerId) {
  return localRead(KEYS.puzzles, {})[ownerId] || []
}

export function markPuzzleComplete(ownerId, puzzleId) {
  const allProgress = localRead(KEYS.puzzles, {})
  const completed = new Set(allProgress[ownerId] || [])
  completed.add(puzzleId)
  allProgress[ownerId] = [...completed]
  localWrite(KEYS.puzzles, allProgress)
  return allProgress[ownerId]
}

export function savePuzzleSnapshot(ownerId, completed) {
  const allProgress = localRead(KEYS.puzzles, {})
  allProgress[ownerId] = [...new Set((completed || []).filter((id) => typeof id === 'string'))]
  localWrite(KEYS.puzzles, allProgress)
  return allProgress[ownerId]
}
