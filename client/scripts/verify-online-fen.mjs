import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { premoveFen } from '../src/lib/premove.js'

const serverFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
const serverPosition = new Chess(serverFen)
assert.equal(serverPosition.turn(), 'b')
assert.ok(serverPosition.moves().includes('e5'))

const position = new Chess(premoveFen(serverFen, 'w'))
assert.equal(premoveFen(serverFen, 'w').split(' ')[3], '-')
assert.equal(position.turn(), 'w')
assert.ok(position.moves().includes('e5'))

console.log('Virtual premove positions clear stale en-passant targets and retain normal legal moves.')
