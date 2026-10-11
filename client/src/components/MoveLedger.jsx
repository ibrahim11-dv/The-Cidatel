import { pieceGlyph } from './ChessBoard'

export function MoveLedger({ history, activePly = null, onSelect }) {
  if (!history.length) return <p className="empty-copy">The score sheet will record each move.</p>

  const rows = []
  for (let index = 0; index < history.length; index++) {
    const move = history[index]
    const number = Number(move.before?.split(' ')[5]) || Math.floor(index / 2) + 1
    if (move.color === 'w' || !rows.length) rows.push({ number, white: null, black: null })
    rows[rows.length - 1][move.color === 'b' ? 'black' : 'white'] = { move, ply: index + 1 }
  }

  return (
    <ol className="move-ledger" aria-label="Move list">
      {rows.map(({ number, white, black }, index) => (
        <li key={index}>
          <span className="move-number">{number}.</span>
          <button className={activePly === white?.ply ? 'active' : ''} type="button" onClick={() => onSelect?.(white.ply)} disabled={!white || !onSelect}>
            {white?.move.san || '…'}
          </button>
          <button className={activePly === black?.ply ? 'active' : ''} type="button" onClick={() => onSelect?.(black.ply)} disabled={!black || !onSelect}>
            {black?.move.san}
          </button>
        </li>
      ))}
    </ol>
  )
}

export function CapturedPieces({ history }) {
  const whiteLost = history.filter((move) => move.captured && move.color === 'b')
  const blackLost = history.filter((move) => move.captured && move.color === 'w')
  return (
    <div className="captures" aria-label="Captured pieces">
      <span>White lost {whiteLost.map((move, index) => <b key={`${move.san}-${index}`}>{pieceGlyph({ color: 'w', type: move.captured })}</b>)}</span>
      <span>Black lost {blackLost.map((move, index) => <b key={`${move.san}-${index}`}>{pieceGlyph({ color: 'b', type: move.captured })}</b>)}</span>
    </div>
  )
}
