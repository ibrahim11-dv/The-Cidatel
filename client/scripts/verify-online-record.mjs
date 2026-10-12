import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { onlineRecord, onlineReview } from '../src/lib/onlineRecord.js'

const mate = onlineRecord(['f2f3', 'e7e5', 'g2g4', 'd8h4'], { score: '0-1' }, { white: 'Alice', black: 'Bob' })
const imported = new Chess()
imported.loadPgn(mate.pgn)
assert.equal(imported.isCheckmate(), true)
assert.equal(imported.getHeaders().Result, '0-1')
assert.equal(imported.getHeaders().White, 'Alice')
assert.equal(imported.getHeaders().Black, 'Bob')
assert.equal(onlineReview(mate, 0).fen, new Chess().fen())
assert.equal(onlineReview(mate, 2).fen, mate.history[1].after)
assert.equal(onlineReview(mate, 2).history.length, 2)
assert.equal(onlineReview(mate, null).fen, imported.fen())
assert.equal(onlineReview(mate, 99).ply, 4)
assert.equal(onlineReview(mate, -1).ply, 0)
assert.equal(mate.history.length, 4)

for (const moves of [
  ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'e1g1'],
  ['e2e4', 'a7a6', 'e4e5', 'd7d5', 'e5d6'],
  ['a2a4', 'h7h5', 'a4a5', 'h5h4', 'a5a6', 'h4h3', 'a6b7', 'h3g2', 'b7a8n'],
]) {
  const record = onlineRecord(moves)
  const loaded = new Chess()
  loaded.loadPgn(record.pgn)
  assert.equal(loaded.fen(), onlineReview(record, null).fen)
  assert.equal(loaded.getHeaders().Result, '*')
}
for (const score of ['1-0', '0-1', '1/2-1/2']) {
  const record = onlineRecord(['e2e4'], { score })
  imported.loadPgn(record.pgn)
  assert.equal(imported.getHeaders().Result, score)
  assert.ok(record.pgn.trim().endsWith(score))
}
console.log('Online record checks passed: review positions, PGN results, castling, en passant and underpromotion.')
