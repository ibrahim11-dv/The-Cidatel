import assert from 'node:assert/strict'
import { onlineRecord } from '../src/lib/onlineRecord.js'
import { onlineSoundEvent } from '../src/lib/onlineSound.js'

const game = (id, result = null) => ({ id, result })
let event = onlineSoundEvent(null, game('table'), [])
assert.equal(event.sound, null)
const e4 = onlineRecord(['e2e4']).history
event = onlineSoundEvent(event.snapshot, game('table'), e4)
assert.equal(event.sound, 'move')
event = onlineSoundEvent(event.snapshot, game('table'), e4)
assert.equal(event.sound, null)
const mate = onlineRecord(['f2f3', 'e7e5', 'g2g4', 'd8h4']).history
event = onlineSoundEvent({ id: 'mate', moves: 3, result: '' }, game('mate', { score: '0-1', reason: 'checkmate' }), mate)
assert.equal(event.sound, 'end')
event = onlineSoundEvent({ id: 'draw', moves: 8, result: '' }, game('draw', { score: '1/2-1/2', reason: 'agreement' }), onlineRecord(['e2e4']).history)
assert.equal(event.sound, 'end')
assert.equal(onlineSoundEvent(event.snapshot, null, []).sound, null)
console.log('Online sound events only announce accepted new moves and authoritative game completion.')
