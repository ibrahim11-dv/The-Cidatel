import assert from 'node:assert/strict'
import { onlineClockMillis } from '../src/lib/onlineClock.js'

const clocks = { whiteMillis: 5000, blackMillis: 8000, running: 'WHITE' }
assert.equal(onlineClockMillis(clocks, 'white', 1000, 2250), 3750)
assert.equal(onlineClockMillis(clocks, 'black', 1000, 2250), 8000)
assert.equal(onlineClockMillis(clocks, 'white', 1000, 9000), 0)
assert.equal(onlineClockMillis(clocks, 'white', 1000, 9000, true), 5000)
assert.equal(onlineClockMillis(clocks, 'white', 1000, 500), 5000)
const afterMove = { whiteMillis: 6500, blackMillis: 8000, running: 'BLACK' }
assert.equal(onlineClockMillis(afterMove, 'white', 3000, 4500), 6500)
assert.equal(onlineClockMillis(afterMove, 'black', 3000, 4500), 6500)
assert.equal(onlineClockMillis({ ...clocks, running: null }, 'white', 1000, 9000), 5000)
console.log('Online clock display checks passed (elapsed time, increments, stopped clocks and zero).')
