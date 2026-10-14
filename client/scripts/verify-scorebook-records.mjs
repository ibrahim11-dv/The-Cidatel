import assert from 'node:assert/strict'
import { scorebookRecords, visibleScorebookRecords } from '../src/lib/scorebookRecords.js'

const records = scorebookRecords([
  { id: 'local-1', createdAt: '2026-10-12T10:00:00.000Z', mode: 'local', result: 'White wins by checkmate', moves: ['e4'] },
  { id: 'bot-1', createdAt: '2026-10-14T08:00:00.000Z', mode: 'bot', result: 'Black wins by resignation', moves: ['e4', 'e5'] },
], [
  { id: 'online-win', savedAtMillis: Date.parse('2026-10-14T12:00:00.000Z'), white: 'club-player', black: 'opponent', result: { score: '1-0', reason: 'resignation' }, moves: ['e2e4', 'e7e5'] },
  { id: 'online-draw', savedAtMillis: Date.parse('2026-10-13T12:00:00.000Z'), white: 'opponent', black: 'club-player', result: { score: '1/2-1/2', reason: 'agreement' }, moves: [] },
  { id: 'online-loss', savedAtMillis: Date.parse('2026-10-11T12:00:00.000Z'), white: 'opponent', black: 'club-player', result: { score: '1-0', reason: 'checkmate' }, moves: ['f2f3'] },
], 'club-player')

assert.deepEqual(records.map((record) => record.id), ['online:online-win', 'local:bot-1', 'online:online-draw', 'local:local-1', 'online:online-loss'])
assert.deepEqual(records.map((record) => record.result), ['Won · resignation', 'Black wins by resignation', 'Draw · agreement', 'White wins by checkmate', 'Lost · checkmate'])
assert.equal(records[0].href, '/online?game=online-win')
assert.equal(records[1].title, 'House bot')
assert.deepEqual(visibleScorebookRecords(records, false, 3).map((record) => record.id), records.slice(0, 3).map((record) => record.id))
assert.deepEqual(visibleScorebookRecords(records, true, 3), records)
console.log('Scorebook records merge local, bot and online results in completion order with player-relative online outcomes.')
