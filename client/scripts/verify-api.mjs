import assert from 'node:assert/strict'
import { authApi, ApiError } from '../src/lib/api.js'

const originalFetch = globalThis.fetch
const originalSet = globalThis.setTimeout
const originalClear = globalThis.clearTimeout
let expire, cleared = 0
globalThis.setTimeout = (callback, delay) => { assert.equal(delay, 10000); expire = callback; return 123 }
globalThis.clearTimeout = (handle) => { assert.equal(handle, 123); cleared++ }
const login = () => authApi.login({ identifier: 'test', password: 'test-only' })
try {
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ message: 'Conflict' }) })
  await assert.rejects(login(), (error) => error instanceof ApiError && error.status === 409 && error.message === 'Conflict')
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ error: 'Internal Server Error' }) })
  await assert.rejects(login(), (error) => error.status === 500 && error.message.includes('server encountered a problem'))
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ message: 'Invalid credentials' }) })
  await assert.rejects(login(), (error) => error.status === 401 && error.message === 'Invalid credentials')
  globalThis.fetch = (_, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))
  const headersStalled = login()
  const headersCheck = assert.rejects(headersStalled, /too long/)
  expire()
  await headersCheck
  globalThis.fetch = async (_, { signal }) => ({ ok: true, json: () => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))) })
  const bodyStalled = login()
  const bodyCheck = assert.rejects(bodyStalled, /too long/)
  await Promise.resolve()
  expire()
  await bodyCheck
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ recovered: true }) })
  assert.deepEqual(await login(), { recovered: true })
  assert.equal(cleared, 6)
  console.log('Passed HTTP error preservation, stalled headers/body timeout, timer cleanup and subsequent recovery.')
} finally {
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSet
  globalThis.clearTimeout = originalClear
}
