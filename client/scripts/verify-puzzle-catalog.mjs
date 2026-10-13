import assert from 'node:assert/strict'
import { difficultyRank, filterPuzzles, nextPuzzleId, nextUnfinishedPuzzle, puzzleCategories, puzzleObjective, sortPuzzlesByDifficulty } from '../src/lib/puzzleCatalog.js'

const studies = [
  { id: 'one', title: 'Foundation', theme: 'Mate in one', themes: ['Mate in one'], difficulty: 'Foundation' },
  { id: 'two', title: 'Club', theme: 'Fork', themes: ['Fork', 'Attraction'], difficulty: 'Club' },
  { id: 'three', title: 'Rated', theme: 'Fork', themes: ['Fork', 'Middlegame'], rating: 998 },
]
assert.deepEqual(puzzleCategories(studies), ['All studies', 'Mate in one', 'Fork', 'Attraction', 'Middlegame'])
assert.deepEqual(filterPuzzles(studies, 'All studies'), studies)
assert.deepEqual(filterPuzzles(studies, 'Fork').map((study) => study.id), ['two', 'three'])
assert.deepEqual(filterPuzzles(studies, 'Unknown'), [])
assert.equal(nextPuzzleId(studies, 'one'), 'two')
assert.equal(nextPuzzleId(studies, 'three'), 'one')
assert.equal(nextPuzzleId(studies, 'missing'), 'one')
assert.equal(nextPuzzleId([], 'one'), null)
assert.deepEqual(sortPuzzlesByDifficulty(studies).map((study) => study.id), ['one', 'three', 'two'])
assert.equal(difficultyRank(studies[0]), 600)
assert.equal(nextUnfinishedPuzzle(studies, ['one']).id, 'three')
assert.equal(nextUnfinishedPuzzle([studies[0]], ['one']), null)
assert.equal(puzzleObjective(studies[0]), 'Deliver mate in one.')
assert.equal(puzzleObjective(studies[1]), 'Find the best tactical continuation.')
console.log('Puzzle category filtering, difficulty progression, objectives and next-study navigation passed.')
