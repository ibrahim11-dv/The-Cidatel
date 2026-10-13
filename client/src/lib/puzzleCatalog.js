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
