import { Link } from 'react-router-dom'
import { getGames, getPuzzleProgress } from '../lib/storage'
import { formatDate } from '../lib/chess'
import { puzzles } from '../data/puzzles'
import { loadPuzzleStats, puzzleSuccessRate } from '../lib/puzzleStats'
import { nextUnfinishedPuzzle } from '../lib/puzzleCatalog'

export function GuestProfilePage() {
  const games = getGames('guest')
  const completed = getPuzzleProgress('guest')
  const studyStats = loadPuzzleStats('guest')
  const nextStudy = nextUnfinishedPuzzle(puzzles, completed)
  const solveRate = puzzleSuccessRate(studyStats)
  return <section className="profile-page">
    <header className="page-heading"><p className="eyebrow">Your personal scorebook</p><h1>Guest player</h1><p>Your completed games stay on this browser. Open any game to replay every move.</p></header>
    <div className="section-heading"><h2>Game record</h2><Link to="/play/local">Start a game</Link></div>
    {games.length ? games.map((game) => <Link className="game-record" to={`/history/${game.id}`} key={game.id}>
      <span>{formatDate(game.createdAt)}</span><b>{game.mode === 'bot' ? 'Stockfish' : 'Local game'}</b><em>{game.result}</em><i>{game.moves.length} ply</i>
    </Link>) : <div className="empty-state"><b>Your next game starts here.</b><p>Complete a local or bot game and its score sheet will appear in this list.</p></div>}
    <section className="guest-study-summary" aria-label="Guest puzzle statistics"><p className="eyebrow">Studies</p><h2>Practice record</h2><p>{completed.length} / {puzzles.length} solved · {solveRate}% solve rate · Streak {studyStats.streak} · Best {studyStats.best}</p>{nextStudy && <p className="small-note">Next in progression: {nextStudy.title}.</p>}<Link className="text-link" to="/puzzles">Continue studies →</Link></section>
    <nav className="table-navigation" aria-label="Profile actions"><Link to="/settings">Appearance settings</Link><Link to="/login">Sign in</Link><Link to="/register">Create an account</Link></nav>
  </section>
}
