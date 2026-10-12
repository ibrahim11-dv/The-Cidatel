import { Chess } from 'chess.js'

// Online games currently always begin from the standard starting position.
export function onlineRecord(moves = [], result = null, players = null) {
  const chess = new Chess()
  const initialFen = chess.fen()
  for (const move of moves) {
    chess.move({ from: move.slice(0, 2), to: move.slice(2, 4), ...(move[4] ? { promotion: move[4] } : {}) })
  }
  chess.header('Event', 'The Citadel online game', 'White', players?.white || '?',
    'Black', players?.black || '?', 'Result', result?.score || '*')
  const history = chess.history({ verbose: true })
  return { initialFen, history, pgn: chess.pgn() }
}

export function onlineReview(record, selectedPly) {
  const ply = selectedPly == null ? record.history.length : Math.max(0, Math.min(selectedPly, record.history.length))
  return {
    ply,
    fen: ply ? record.history[ply - 1].after : record.initialFen,
    lastMove: record.history[ply - 1],
    history: record.history.slice(0, ply),
  }
}
