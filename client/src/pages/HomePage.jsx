import { useState } from 'react'
import { Chess } from 'chess.js'
import { Link } from 'react-router-dom'
import { ChessBoard } from '../components/ChessBoard'

const modes = [
  ['01', 'Play locally', 'A shared board for two people at one table.', '/play/local'],
  ['02', 'Play Stockfish', 'Six engine strengths, from beginner to master.', '/play/bot'],
  ['03', 'Puzzles', 'Six composed positions for your scorebook.', '/puzzles'],
  ['04', 'Play online', 'Rooms and correspondence tables are being prepared.', '/online'],
]

export function HomePage() {
  const [fen, setFen] = useState(() => new Chess().fen())

  function makeMove(move) {
    const game = new Chess(fen)
    try {
      game.move(move)
      setFen(game.fen())
      return true
    } catch {
      return false
    }
  }

  return (
    <section className="home-page">
      <div className="home-intro">
        <p className="eyebrow">A digital chess club</p>
        <h1>Play the long game.</h1>
        <p className="lede">The Citadel is a quiet table for serious games, small studies, and a record of every move worth keeping.</p>
        <p className="small-note">The board is live. Make the opening move.</p>
      </div>
      <div className="home-board-area">
        <ChessBoard fen={fen} onMove={makeMove} label="A playable opening chessboard" />
        <button className="quiet-button" type="button" onClick={() => setFen(new Chess().fen())}>Reset board</button>
      </div>
      <div className="mode-index" aria-label="Chess modes">
        <p className="eyebrow">Choose a table</p>
        {modes.map(([number, title, description, to]) => (
          <Link className="mode-row" key={to} to={to}>
            <span className="mode-number">{number}</span>
            <span><strong>{title}</strong><small>{description}</small></span>
            <span className="mode-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
      <aside className="home-note">
        <span>Club note / 01</span>
        <p>Some games are played quickly. The good ones ask you to sit a while.</p>
      </aside>
    </section>
  )
}
