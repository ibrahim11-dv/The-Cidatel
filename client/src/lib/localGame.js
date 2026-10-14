import { Chess } from 'chess.js'
import { assertPlayablePosition, getDrawClaim, getIntendedDrawClaim, getTerminalState } from './chess.js'

const PGN_RESULTS = {
  '1-0': 'White wins — imported PGN result',
  '0-1': 'Black wins — imported PGN result',
  '1/2-1/2': 'Draw — imported PGN result',
}

function replayValidated(initialFen, moves) {
  const game = new Chess(initialFen)
  assertPlayablePosition(game)
  for (const move of moves) {
    if (getTerminalState(game)) throw new Error('Moves follow an automatic game ending.')
    game.move(move)
  }
  return game
}

export const TIME_CONTROLS = [
  ['0+0', 'Untimed'], ['1+0', '1 + 0'], ['1+1', '1 + 1'], ['2+1', '2 + 1'],
  ['3+0', '3 + 0'], ['3+2', '3 + 2'], ['5+0', '5 + 0'], ['5+3', '5 + 3'],
  ['10+0', '10 + 0'], ['10+5', '10 + 5'], ['15+10', '15 + 10'], ['30+0', '30 + 0'],
]

export function timeoutResult(game, loser) {
  const winner = loser === 'w' ? 'b' : 'w'
  const pieces = game.board().flat().filter(Boolean)
  const army = pieces.filter((piece) => piece.color === winner && piece.type !== 'k')
  const opposition = pieces.filter((piece) => piece.color === loser && piece.type !== 'k')
  // A bare king can never mate. A lone minor cannot mate a bare king.
  if (!army.length || game.isInsufficientMaterial() ||
      (!opposition.length && army.length === 1 && ['b', 'n'].includes(army[0].type))) {
    return 'Draw on time — opponent has insufficient mating material'
  }
  return `${winner === 'w' ? 'White' : 'Black'} wins on time`
}

export class LocalGame {
  constructor({ control = '0+0', fen, pgn, now = Date.now() } = {}) {
    if (!TIME_CONTROLS.some(([value]) => value === control)) throw new Error('Unsupported time control.')
    this.chess = new Chess(fen)
    assertPlayablePosition(this.chess)
    this.id = globalThis.crypto.randomUUID()
    if (pgn) this.chess.loadPgn(pgn)
    this.initialFen = this.chess.history({ verbose: true })[0]?.before || this.chess.fen()
    if (pgn) replayValidated(this.initialFen, this.chess.history())
    this.control = control
    const [minutes, increment] = control.split('+').map(Number)
    this.timed = minutes > 0
    this.increment = increment * 1000
    this.remaining = { w: minutes * 60000, b: minutes * 60000 }
    this.anchor = now
    this.started = false
    this.undoClocks = []
    this.result = getTerminalState(this.chess) || (pgn ? PGN_RESULTS[this.chess.getHeaders().Result] || null : null)
    this.finishedAt = this.result ? now : null
  }

  clocks(now = Date.now()) {
    const values = { ...this.remaining }
    if (this.timed && this.started && !this.result) {
      values[this.chess.turn()] = Math.max(0, values[this.chess.turn()] - Math.max(0, now - this.anchor))
    }
    return values
  }

  tick(now = Date.now()) {
    if (!this.result && this.timed && this.started && this.clocks(now)[this.chess.turn()] <= 0) {
      this.finish(timeoutResult(this.chess, this.chess.turn()), now)
    }
    return this.result
  }

  start(now = Date.now()) {
    if (this.started || this.result) return
    this.started = true
    this.anchor = now
  }

  move(move, now = Date.now()) {
    if (this.tick(now)) return null
    const side = this.chess.turn()
    const clocks = this.clocks(now)
    let played
    try { played = this.chess.move(move) } catch { return null }
    this.undoClocks.push({ remaining: { ...clocks }, started: this.started })
    this.remaining = clocks
    if (this.timed) this.remaining[side] += this.increment
    this.started = true
    this.anchor = now
    const terminal = getTerminalState(this.chess)
    if (terminal) this.finish(terminal, now)
    return played
  }

  finish(result, now = Date.now()) {
    if (this.result) return
    this.remaining = this.clocks(now)
    this.result = result
    this.finishedAt = now
  }

  claimDraw(intendedMove = null, now = Date.now()) {
    if (this.tick(now)) return false
    const result = intendedMove ? getIntendedDrawClaim(this.chess, intendedMove) : getDrawClaim(this.chess)
    if (!result) return false
    this.finish(result, now)
    return true
  }

  canTakeBack(color) {
    if (this.result || !this.undoClocks.length) return false
    const recent = this.chess.history({ verbose: true }).slice(-this.undoClocks.length)
    return recent.some((move) => move.color === color)
  }

  takeBack(color, now = Date.now()) {
    if (this.tick(now) || !this.canTakeBack(color)) return false
    let undone
    do {
      undone = this.chess.undo()
      const clock = this.undoClocks.pop()
      this.remaining = { ...clock.remaining }
      this.started = clock.started
    } while (undone.color !== color)
    this.anchor = now
    return true
  }

  snapshot() {
    return { version: 1, id: this.id, control: this.control, initialFen: this.initialFen,
      moves: this.chess.history(), remaining: this.remaining, anchor: this.anchor,
      started: this.started, result: this.result, finishedAt: this.finishedAt }
  }

  static restore(data, now = Date.now()) {
    if (data?.version !== 1 || !Array.isArray(data.moves) || !Number.isFinite(data.anchor) ||
        !['w', 'b'].every((side) => Number.isFinite(data.remaining?.[side]) && data.remaining[side] >= 0)) {
      throw new Error('Invalid saved game.')
    }
    const model = new LocalGame({ control: data.control, fen: data.initialFen, now })
    if (typeof data.id === 'string') model.id = data.id
    model.chess = replayValidated(data.initialFen, data.moves)
    model.remaining = data.remaining
    model.anchor = data.anchor
    model.started = Boolean(data.started)
    model.result = getTerminalState(model.chess) || (typeof data.result === 'string' ? data.result : null)
    model.finishedAt = model.result
      ? (Number.isFinite(data.finishedAt) && data.finishedAt >= 0 ? data.finishedAt : now)
      : null
    model.tick(now)
    return model
  }
}

export function formatClock(ms) {
  const seconds = Math.ceil(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
