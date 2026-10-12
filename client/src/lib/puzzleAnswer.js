// Accept an alternative final mate by its actual position, not a SAN suffix alone.
// Earlier moves still follow the supplied line until verified branches are available.
export function isPuzzleAnswer(puzzle, step, played, position) {
  const expected = puzzle.solution[step]
  if (!expected) return false
  if (played.san === expected) return true
  return step === puzzle.solution.length - 1 && expected.endsWith('#') && position.isCheckmate()
}
