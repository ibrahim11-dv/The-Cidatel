import { Chess } from 'chess.js'
import { puzzles } from '../src/data/puzzles.js'
import { assertPlayablePosition } from '../src/lib/chess.js'

for (const puzzle of puzzles) {
  const game = new Chess(puzzle.fen)
  assertPlayablePosition(game)
  for (const san of puzzle.solution) { game.move(san); assertPlayablePosition(game) }
  if (!game.isGameOver()) throw new Error(`${puzzle.id} does not reach a terminal position`)
}

console.log(`Validated ${puzzles.length} puzzle positions.`)
