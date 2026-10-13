import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { premoveFen, premoveText } from '../src/lib/premove.js'

const initial = new Chess().fen()
assert.equal(new Chess(initial).turn(), 'w')
assert.equal(new Chess(premoveFen(initial, 'b')).turn(), 'b')
assert.ok(new Chess(premoveFen(initial, 'b')).moves({ square: 'e7' }).includes('e5'))
assert.equal(premoveFen('invalid position', 'b'), 'invalid position')
assert.equal(premoveFen(initial, 'invalid'), initial)
assert.equal(premoveText({ from: 'e2', to: 'e4' }), 'e2–e4')
assert.equal(premoveText({ from: 'a7', to: 'a8', promotion: 'q' }), 'a7–a8=Q')
console.log('Premove checks passed: the board can prepare the player’s legal options without changing the authoritative position.')
