import assert from 'node:assert/strict'
import { emptyPuzzleStats, updatePuzzleStats, loadPuzzleStats, savePuzzleStats } from '../src/lib/puzzleStats.js'
let stats = emptyPuzzleStats()
const event = (id, type) => { stats = updatePuzzleStats(stats, id, type) }
event('one', 'start'); event('one', 'solve'); event('one', 'solve')
assert.deepEqual([stats.attempted, stats.solved, stats.streak, stats.best], [1, 1, 1, 1])
event('two', 'solve')
assert.equal(stats.best, 2)
event('three', 'mistake'); event('three', 'solve')
assert.deepEqual([stats.solved, stats.unassisted, stats.streak, stats.best], [3, 2, 0, 2])
event('four', 'hint'); event('four', 'solve')
assert.equal(stats.unassisted, 2)
event('five', 'reveal'); event('five', 'solve')
assert.equal(stats.solved, 4)
event('six', 'solve'); event('seven', 'start'); event('eight', 'solve')
assert.equal(stats.streak, 1, 'Abandoning an attempt breaks a streak')
assert.equal(stats.attempted, 8)
const values = new Map()
global.window = { localStorage: { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) } }
savePuzzleStats('guest', stats)
assert.deepEqual(loadPuzzleStats('guest'), stats)
assert.deepEqual(loadPuzzleStats('account'), emptyPuzzleStats())
values.set('citadel:puzzle-stats:guest', '{broken')
assert.deepEqual(loadPuzzleStats('guest'), emptyPuzzleStats())
window.localStorage.setItem = () => { throw new Error('Storage unavailable') }
assert.doesNotThrow(() => savePuzzleStats('guest', stats))
console.log('Puzzle statistics passed: retries, duplicate solve, hints, mistakes, reveals, abandonment and storage isolation.')
