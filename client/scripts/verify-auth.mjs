import assert from 'node:assert/strict'
import { readAuthForm } from '../src/lib/authForm.js'

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
} = await import('../src/lib/storage.js')

const firstSession = saveAuthenticatedSession({
  accessToken: 'test-jwt',
  user: {
    id: 'account-1',
    username: 'club_qa',
    email: 'club.qa@example.test',
    preferences: { boardTheme: 'walnut', pieceStyle: 'classic', pieceTone: 'ivory' },
  },
})

assert.equal(firstSession.username, 'club_qa')
assert.equal(getAccessToken(), 'test-jwt')
assert.equal(getSession().email, 'club.qa@example.test')

const appearanceSession = updateSavedSession({
  id: 'account-1',
  username: 'club_member',
  email: 'member@example.test',
  preferences: { boardTheme: 'forest', pieceStyle: 'modern', pieceTone: 'brass' },
})
assert.equal(appearanceSession.username, 'club_member')
assert.deepEqual(appearanceSession.preferences, { boardTheme: 'forest', pieceStyle: 'modern', pieceTone: 'brass' })

clearSession()
assert.equal(getSession(), null)
assert.equal(getAccessToken(), null)

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
