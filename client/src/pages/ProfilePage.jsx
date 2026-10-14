import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChessBoard } from '../components/ChessBoard'
import { useSession } from '../context/SessionContext'
import { puzzles } from '../data/puzzles'
import { formatDate, initials, STARTING_FEN } from '../lib/chess'
import { getGames, getPuzzleProgress, savePuzzleSnapshot } from '../lib/storage'
import { loadPuzzleStats, puzzleSuccessRate, savePuzzleStats } from '../lib/puzzleStats'
import { gameApi, puzzleApi } from '../lib/api'
import { onlineResultStats } from '../lib/onlineHistory'
import { nextUnfinishedPuzzle } from '../lib/puzzleCatalog'
import { scorebookRecords, visibleScorebookRecords } from '../lib/scorebookRecords'

const boardThemes = [
  ['walnut', 'Walnut', 'Warm tournament wood'],
  ['forest', 'Forest', 'Green felt and boxwood'],
  ['midnight', 'Midnight', 'Blue slate and ash'],
]

const pieceStyles = [
  ['classic', 'Classic', 'Outlined Staunton'],
  ['modern', 'Modern', 'Crisp club set'],
  ['manuscript', 'Manuscript', 'Printed scorebook'],
]

const pieceTones = [
  ['ivory', 'Ivory'],
  ['ebony', 'Ebony'],
  ['brass', 'Brass'],
]

export function ProfilePage() {
  const { session, preferences, updateAccount, changePassword, setPreferences } = useSession()
  const [identity, setIdentity] = useState({ username: session.username, email: session.email })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [accountMessage, setAccountMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [appearanceMessage, setAppearanceMessage] = useState('')
  const games = getGames(session.id)
  const [completed, setCompleted] = useState(() => getPuzzleProgress(session.id))
  const [studyStats, setStudyStats] = useState(() => loadPuzzleStats(session.id))
  const [onlineGames, setOnlineGames] = useState([])
  const [onlineHistoryLoaded, setOnlineHistoryLoaded] = useState(false)
  const [showAllRecords, setShowAllRecords] = useState(false)
  const localWins = games.filter((game) => game.result.startsWith(game.ownerColor === 'w' ? 'White wins' : 'Black wins')).length
  const localDraws = games.filter((game) => game.result.startsWith('Draw')).length
  const onlineTotals = onlineResultStats(onlineGames, session.id)
  const wins = localWins + onlineTotals.wins
  const draws = localDraws + onlineTotals.draws
  const solveRate = puzzleSuccessRate(studyStats)
  const nextStudy = nextUnfinishedPuzzle(puzzles, completed)
  const records = scorebookRecords(games, onlineGames, session.id)
  const visibleRecords = visibleScorebookRecords(records, showAllRecords)

  useEffect(() => {
    let active = true
    puzzleApi.progress().then((progress) => {
      if (!active) return
      const local = { completed: getPuzzleProgress(session.id), stats: loadPuzzleStats(session.id) }
      const snapshot = progress.completed.length || progress.stats.attempted ? progress : local
      savePuzzleSnapshot(session.id, snapshot.completed)
      savePuzzleStats(session.id, snapshot.stats)
      setCompleted(snapshot.completed)
      setStudyStats(snapshot.stats)
    }).catch(() => {
      // The profile remains useful from its local puzzle cache while offline.
    })
    return () => { active = false }
  }, [session.id])

  useEffect(() => {
    let active = true
    gameApi.history().then((records) => { if (active) setOnlineGames(records) }).catch(() => {
      // Local records remain available when the online history service is unavailable.
    }).finally(() => { if (active) setOnlineHistoryLoaded(true) })
    return () => { active = false }
  }, [])

  function updateIdentity(event) {
    setIdentity((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updatePasswordField(event) {
    setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveIdentity(event) {
    event.preventDefault()
    setAccountMessage('')
    try {
      await updateAccount(identity)
      setAccountMessage('Account details updated.')
    } catch (issue) {
      setAccountMessage(issue.message)
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setPasswordMessage('')
    try {
      await changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordMessage('Password updated.')
    } catch (issue) {
      setPasswordMessage(issue.message)
    }
  }

  async function updateAppearance(patch) {
    setAppearanceMessage('')
    try {
      await setPreferences(patch)
      setAppearanceMessage('Board appearance saved.')
    } catch (issue) {
      setAppearanceMessage(issue.message || 'We could not save the board appearance.')
    }
  }

  return (
    <section className="profile-page">
      <header className="scorebook-cover">
        <div className="profile-monogram">{initials(session.username)}</div>
        <div><p className="eyebrow">Personal scorebook</p><h1>{session.username}</h1><p>{session.email} · Club account</p></div>
        <div className="member-stamp"><span>Member card</span><b>The Citadel</b><em>CLUB / 001</em></div>
      </header>

      <div className="stat-line" aria-label="Player statistics">
        <div><span>Games recorded</span><b>{games.length + onlineGames.length}</b></div>
        <div><span>Wins</span><b>{wins}</b></div>
        <div><span>Draws</span><b>{draws}</b></div>
        <div><span>Studies solved</span><b>{completed.length} / {puzzles.length}</b></div>
      </div>

      <div className="scorebook-grid">
        <section className="history-list"><div className="section-heading"><div><p className="eyebrow">Recent games</p><h2>Game record</h2></div><div className="section-links"><Link to="/play/local">Local</Link><Link to="/online">Online</Link></div></div>
          {records.length ? <>{visibleRecords.map((record) => <Link className="game-record" to={record.href} key={record.id}><span>{formatDate(record.date)}</span><b>{record.title}</b><em>{record.result}</em><i>{record.ply} ply</i></Link>)}
            {records.length > 7 && <button type="button" className="text-button scorebook-toggle" aria-expanded={showAllRecords} onClick={() => setShowAllRecords((expanded) => !expanded)}>{showAllRecords ? 'Show recent games' : `Show all ${records.length} games`}</button>}
          </> : onlineHistoryLoaded ? <div className="empty-state"><b>No games recorded yet.</b><p>Finish a local, bot, or online game and its score sheet will appear here.</p></div> : <p className="small-note" role="status">Loading your club tables…</p>}
        </section>
        <aside className="study-progress"><p className="eyebrow">Studies</p><h2>Notebook marks</h2><div className="study-metrics" aria-label="Puzzle statistics"><div><span>Solve rate</span><b>{solveRate}%</b></div><div><span>Current streak</span><b>{studyStats.streak}</b></div><div><span>Best streak</span><b>{studyStats.best}</b></div></div>{nextStudy && <p className="study-next">Next in progression: <b>{nextStudy.title}</b></p>}{puzzles.map((puzzle, index) => <div key={puzzle.id} className={completed.includes(puzzle.id) ? 'completed-study' : ''}><span>{String(index + 1).padStart(2, '0')}</span><b>{puzzle.title}</b><em>{completed.includes(puzzle.id) ? 'Solved' : 'Open'}</em></div>)}<Link className="text-link" to="/puzzles">Visit study room →</Link></aside>
      </div>

      <section className="settings-desk" aria-label="Account and appearance settings">
        <div className="settings-heading"><p className="eyebrow">Club room settings</p><h2>Make the table yours.</h2><p>These details are saved with your club account and follow you through every board.</p></div>
        <div className="appearance-studio">
          <div className="appearance-preview"><ChessBoard fen={STARTING_FEN} interactive={false} label="Board appearance preview" /></div>
          <div className="appearance-controls">
            <fieldset><legend>Board</legend><div className="choice-grid">{boardThemes.map(([value, name, description]) => <button className={`appearance-choice board-choice board-choice-${value} ${preferences.boardTheme === value ? 'selected' : ''}`} type="button" onClick={() => void updateAppearance({ boardTheme: value })} key={value}><span /><b>{name}</b><small>{description}</small></button>)}</div></fieldset>
            <fieldset><legend>Piece style</legend><div className="choice-grid compact">{pieceStyles.map(([value, name, description]) => <button className={`appearance-choice ${preferences.pieceStyle === value ? 'selected' : ''}`} type="button" onClick={() => void updateAppearance({ pieceStyle: value })} key={value}><b>{name}</b><small>{description}</small></button>)}</div></fieldset>
            <fieldset><legend>Piece tone</legend><div className="tone-row">{pieceTones.map(([value, name]) => <button className={`tone-choice tone-${value} ${preferences.pieceTone === value ? 'selected' : ''}`} type="button" onClick={() => void updateAppearance({ pieceTone: value })} key={value}><i>♟</i>{name}</button>)}</div></fieldset>
            {appearanceMessage && <p className="settings-message" role="status">{appearanceMessage}</p>}
          </div>
        </div>

        <div className="account-settings">
          <form className="settings-form" onSubmit={saveIdentity}>
            <p className="eyebrow">Account details</p>
            <h3>Identity</h3>
            <label htmlFor="account-username">Username</label>
            <input id="account-username" name="username" value={identity.username} onChange={updateIdentity} minLength="3" maxLength="20" required />
            <label htmlFor="account-email">Email address</label>
            <input id="account-email" name="email" type="email" value={identity.email} onChange={updateIdentity} required />
            {accountMessage && <p className="settings-message" role="status">{accountMessage}</p>}
            <button className="quiet-button" type="submit">Save details</button>
          </form>
          <form className="settings-form" onSubmit={savePassword}>
            <p className="eyebrow">Security</p>
            <h3>Change password</h3>
            <label htmlFor="current-password">Current password</label>
            <input id="current-password" name="currentPassword" type="password" value={passwords.currentPassword} onChange={updatePasswordField} autoComplete="current-password" required />
            <label htmlFor="new-password">New password</label>
            <input id="new-password" name="newPassword" type="password" value={passwords.newPassword} onChange={updatePasswordField} autoComplete="new-password" minLength="8" required />
            <label htmlFor="new-password-repeat">Repeat new password</label>
            <input id="new-password-repeat" name="confirmPassword" type="password" value={passwords.confirmPassword} onChange={updatePasswordField} autoComplete="new-password" minLength="8" required />
            {passwordMessage && <p className="settings-message" role="status">{passwordMessage}</p>}
            <button className="quiet-button" type="submit">Update password</button>
          </form>
        </div>
      </section>
    </section>
  )
}
