import assert from 'node:assert/strict'
import { filterPuzzles, nextPuzzleId, puzzleCategories } from '../src/lib/puzzleCatalog.js'

const studies = [
  { id: 'one', theme: 'Mate in one', themes: ['Mate in one'] },
  { id: 'two', theme: 'Fork', themes: ['Fork', 'Attraction'] },
  { id: 'three', theme: 'Fork', themes: ['Fork', 'Middlegame'] },
]
assert.deepEqual(puzzleCategories(studies), ['All studies', 'Mate in one', 'Fork', 'Attraction', 'Middlegame'])
assert.deepEqual(filterPuzzles(studies, 'All studies'), studies)
assert.deepEqual(filterPuzzles(studies, 'Fork').map((study) => study.id), ['two', 'three'])
assert.deepEqual(filterPuzzles(studies, 'Unknown'), [])
assert.equal(nextPuzzleId(studies, 'one'), 'two')
assert.equal(nextPuzzleId(studies, 'three'), 'one')
assert.equal(nextPuzzleId(studies, 'missing'), 'one')
assert.equal(nextPuzzleId([], 'one'), null)
console.log('Puzzle category filtering and in-category next-study navigation passed.')
