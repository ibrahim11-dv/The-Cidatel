import { Chess } from 'chess.js'
import { puzzles } from '../src/data/puzzles.js'
import { assertPlayablePosition } from '../src/lib/chess.js'
import assert from 'node:assert/strict'
import { isPuzzleAnswer } from '../src/lib/puzzleAnswer.js'

let alternatives = 0
for (const puzzle of puzzles.filter((item) => item.solution.length === 1)) {
  for (const move of new Chess(puzzle.fen).moves()) {
    const position = new Chess(puzzle.fen)
    const played = position.move(move)
    assert.equal(isPuzzleAnswer(puzzle, 0, played, position), position.isCheckmate(), `${puzzle.id}: ${move}`)
    if (position.isCheckmate() && move !== puzzle.solution[0]) alternatives++
  }
}
assert.ok(alternatives > 0, 'The fixtures must exercise at least one alternative checkmate.')

for (const puzzle of puzzles) {
  const game = new Chess(puzzle.fen)
  assertPlayablePosition(game)
  for (const [step, san] of puzzle.solution.entries()) {
    const played = game.move(san)
    assertPlayablePosition(game)
    assert.ok(isPuzzleAnswer(puzzle, step, played, game))
    assert.equal(isPuzzleAnswer(puzzle, puzzle.solution.length, played, game), false)
  }
  if (!game.isGameOver()) throw new Error(`${puzzle.id} does not reach a terminal position`)
}

console.log(`Validated ${puzzles.length} puzzle positions and ${alternatives} alternative mating answers; rejected non-mates in mate-in-one studies.`)
