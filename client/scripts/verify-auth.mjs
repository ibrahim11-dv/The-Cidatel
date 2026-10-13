import assert from 'node:assert/strict'
import { readAuthForm } from '../src/lib/authForm.js'
import { signInDestination, safeReturnPath } from '../src/lib/authRedirect.js'

const invitedPath = '/online?invite=7ee6f2f3-811f-4f66-a08e-81b5f88d5e59'
const loginPath = signInDestination({ pathname: '/online', search: invitedPath.slice(7), hash: '#join' })
const returnPath = new URLSearchParams(loginPath.split('?')[1]).get('next')
assert.equal(safeReturnPath(returnPath), `${invitedPath}#join`)
assert.equal(signInDestination({ pathname: '/online' }), '/login?next=%2Fonline')
for (const unsafe of [null, '', 'https://example.test', '//example.test', '/\\example.test', '/\n/example.test']) {
  assert.equal(safeReturnPath(unsafe), '/profile')
}

const localValues = new Map()
const sessionValues = new Map()
function createStorage(values) {
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

global.window = {
  localStorage: createStorage(localValues),
  sessionStorage: createStorage(sessionValues),
}

const {
  clearSession,
  getAccessToken,
  getSession,
  saveAuthenticatedSession,
  updateSavedSession,
  getPuzzleProgress,
  markPuzzleComplete,
  savePuzzleSnapshot,
  getGuestPreferences,
  saveGuestPreferences,
} = await import('../src/lib/storage.js')

const firstSession = saveAuthenticatedSession({
  accessToken: 'test-jwt',
  user: {
    id: 'account-1',
    username: 'club_qa',
    email: 'club.qa@example.test',
    preferences: { boardTheme: 'walnut', pieceStyle: 'classic', pieceTone: 'ivory', customColors: {} },
  },
})

assert.equal(firstSession.username, 'club_qa')
assert.equal(getAccessToken(), 'test-jwt')
assert.equal(getSession().email, 'club.qa@example.test')

const appearanceSession = updateSavedSession({
  id: 'account-1',
  username: 'club_member',
  email: 'member@example.test',
  preferences: { boardTheme: 'forest', pieceStyle: 'modern', pieceTone: 'brass', customColors: { '--paper': '#112233' } },
})
assert.equal(appearanceSession.username, 'club_member')
assert.deepEqual(appearanceSession.preferences, { boardTheme: 'forest', pieceStyle: 'modern', pieceTone: 'brass', customColors: { '--paper': '#112233' } })

clearSession()
assert.equal(getSession(), null)
assert.equal(getAccessToken(), null)
saveGuestPreferences({ pieceStyle: 'modern', pieceTone: 'brass' })
assert.equal(getGuestPreferences().pieceTone, 'brass')
assert.equal(getGuestPreferences().pieceStyle, 'modern')
saveGuestPreferences({ pieceStyle: 'unknown', pieceTone: 'unknown' })
assert.equal(getGuestPreferences().pieceTone, 'ivory')
assert.equal(getGuestPreferences().pieceStyle, 'classic')
assert.deepEqual(markPuzzleComplete('guest', 'quiet-crown'), ['quiet-crown'])
assert.deepEqual(markPuzzleComplete('guest', 'quiet-crown'), ['quiet-crown'])
assert.deepEqual(getPuzzleProgress('account-1'), [])
markPuzzleComplete('account-1', 'eighth-rank')
assert.deepEqual(getPuzzleProgress('guest'), ['quiet-crown'])
assert.deepEqual(getPuzzleProgress('account-1'), ['eighth-rank'])
const accountSnapshot = { completed: ['eighth-rank', 'legals-mate', 'legals-mate'], stats: { attempted: 2, solved: 1, unassisted: 1, streak: 1, best: 1, active: null } }
assert.deepEqual(savePuzzleSnapshot('account-1', accountSnapshot.completed), ['eighth-rank', 'legals-mate'])
assert.deepEqual(getPuzzleProgress('account-1'), ['eighth-rank', 'legals-mate'])

const browserFormValues = readAuthForm([
  ['username', '  club_member  '],
  ['email', '  member@example.test '],
  ['password', 'QuietTable9'],
  ['confirmPassword', 'QuietTable9'],
], true)
assert.deepEqual(browserFormValues, {
  username: 'club_member',
  email: 'member@example.test',
  password: 'QuietTable9',
  confirmPassword: 'QuietTable9',
})

console.log('Validated the browser session boundary and native-form registration values for API-authenticated accounts.')
