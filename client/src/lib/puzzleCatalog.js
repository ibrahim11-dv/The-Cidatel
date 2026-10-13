export function puzzleCategories(puzzles) {
  return ['All studies', ...new Set(puzzles.flatMap((puzzle) => puzzle.themes || [puzzle.theme]))]
}

export function filterPuzzles(puzzles, category) {
  return category === 'All studies' ? puzzles : puzzles.filter((puzzle) => (puzzle.themes || [puzzle.theme]).includes(category))
}

export function nextPuzzleId(puzzles, currentId) {
  if (!puzzles.length) return null
  const index = puzzles.findIndex((puzzle) => puzzle.id === currentId)
  return puzzles[(index + 1 + puzzles.length) % puzzles.length].id
}

export function difficultyRank(puzzle) {
  if (Number.isFinite(puzzle.rating)) return puzzle.rating
  return ({ Foundation: 600, Club: 1400 })[puzzle.difficulty] || 1000
}

export function sortPuzzlesByDifficulty(puzzles) {
  return [...puzzles].sort((left, right) => difficultyRank(left) - difficultyRank(right) || left.title.localeCompare(right.title))
}

export function nextUnfinishedPuzzle(puzzles, completed) {
  const finished = new Set(completed)
  return sortPuzzlesByDifficulty(puzzles).find((puzzle) => !finished.has(puzzle.id)) || null
}

export function puzzleObjective(puzzle) {
  if (puzzle.theme.startsWith('Mate in ')) return `Deliver ${puzzle.theme.toLowerCase()}.`
  return 'Find the best tactical continuation.'
}
