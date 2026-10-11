import { Chess } from 'chess.js'

export const STARTING_FEN = new Chess().fen()

export function assertPlayablePosition(game) {
  const opponent = game.turn() === 'w' ? 'b' : 'w'
  const king = game.board().flat().find((piece) => piece?.color === opponent && piece.type === 'k')
  if (!king || game.isAttacked(king.square, game.turn())) {
    throw new Error('Invalid position: the side that just moved left its king in check.')
  }
}

export function getTerminalState(game) {
  if (game.isCheckmate()) {
    return `${game.turn() === 'w' ? 'Black' : 'White'} wins by checkmate`
  }
  if (game.isStalemate()) return 'Draw by stalemate'
  if (game.isInsufficientMaterial()) return 'Draw by insufficient material'
  if (repetitionCount(game) >= 5) return 'Draw by fivefold repetition'
  if (Number(game.fen().split(' ')[4]) >= 150) return 'Draw by seventy-five-move rule'
  return null
}

export function repetitionCount(game) {
  const key = (fen) => fen.split(' ').slice(0, 4).join(' ')
  const history = game.history({ verbose: true })
  const current = key(game.fen())
  const positions = history.length ? [history[0].before, ...history.map((move) => move.after)] : [game.fen()]
  return positions.filter((fen) => key(fen) === current).length
}

export function getDrawClaim(game) {
  if (game.isThreefoldRepetition()) return 'Draw by threefold repetition claim'
  if (game.isDrawByFiftyMoves()) return 'Draw by fifty-move rule claim'
  return null
}

// FIDE claims can concern the current position or a legal intended move. Undo
// restores the complete repetition stack; the announced move is not played.
export function getIntendedDrawClaim(game, move) {
  let played
  try { played = game.move(move) } catch { return null }
  if (!played) return null
  try { return getDrawClaim(game) } finally { game.undo() }
}

export function materialBalance(game) {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
  return game.board().flat().filter(Boolean).reduce((total, piece) => total + values[piece.type] * (piece.color === 'w' ? 1 : -1), 0)
}

export function getCapturedPieces(history) {
  return {
    white: history.filter((move) => move.captured && move.color === 'w').map((move) => move.captured),
    black: history.filter((move) => move.captured && move.color === 'b').map((move) => move.captured),
  }
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'WC'
}
