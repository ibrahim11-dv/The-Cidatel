import assert from 'node:assert/strict'
import { onlineResultStats } from '../src/lib/onlineHistory.js'

const account = 'member'
const records = [
  { white: account, black: 'opponent-a', result: { score: '1-0' } },
  { white: 'opponent-b', black: account, result: { score: '0-1' } },
  { white: account, black: 'opponent-c', result: { score: '1/2-1/2' } },
  { white: account, black: 'opponent-d', result: { score: '0-1' } },
  { white: account, black: 'opponent-e', result: null },
]
assert.deepEqual(onlineResultStats(records, account), { wins: 2, draws: 1 })
assert.deepEqual(onlineResultStats([], account), { wins: 0, draws: 0 })
console.log('Online history totals correctly count wins by side and draws.')
