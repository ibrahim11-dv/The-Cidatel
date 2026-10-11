import { Link } from 'react-router-dom'
import { getGames } from '../lib/storage'
import { formatDate } from '../lib/chess'

export function GuestProfilePage() {
  const games = getGames('guest')
  return <section className="profile-page">
    <header className="page-heading"><p className="eyebrow">Your personal scorebook</p><h1>Guest player</h1><p>Your completed games stay on this browser. Open any game to replay every move.</p></header>
    <div className="section-heading"><h2>Game record</h2><Link to="/play/local">Start a game</Link></div>
    {games.length ? games.map((game) => <Link className="game-record" to={`/history/${game.id}`} key={game.id}>
      <span>{formatDate(game.createdAt)}</span><b>{game.mode === 'bot' ? 'Stockfish' : 'Local game'}</b><em>{game.result}</em><i>{game.moves.length} ply</i>
    </Link>) : <div className="empty-state"><b>Your next game starts here.</b><p>Complete a local or bot game and its score sheet will appear in this list.</p></div>}
    <nav className="table-navigation" aria-label="Profile actions"><Link to="/settings">Appearance settings</Link><Link to="/login">Sign in</Link><Link to="/register">Create an account</Link></nav>
  </section>
}
