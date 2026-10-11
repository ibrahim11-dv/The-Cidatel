import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChessBoard } from '../components/ChessBoard'
import { useSession } from '../context/SessionContext'
import { puzzles } from '../data/puzzles'
import { formatDate, initials, STARTING_FEN } from '../lib/chess'
import { getGames, getPuzzleProgress } from '../lib/storage'

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
  const completed = getPuzzleProgress(session.id)
  const wins = games.filter((game) => game.result.startsWith(game.ownerColor === 'w' ? 'White wins' : 'Black wins')).length
  const draws = games.filter((game) => game.result.startsWith('Draw')).length

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
        <div><span>Games recorded</span><b>{games.length}</b></div>
        <div><span>Wins</span><b>{wins}</b></div>
        <div><span>Draws</span><b>{draws}</b></div>
        <div><span>Studies solved</span><b>{completed.length} / {puzzles.length}</b></div>
      </div>

      <div className="scorebook-grid">
        <section className="history-list"><div className="section-heading"><div><p className="eyebrow">Recent games</p><h2>Game record</h2></div><Link to="/play/local">Start a game</Link></div>
          {games.length ? games.slice(0, 7).map((game) => <Link className="game-record" to={`/history/${game.id}`} key={game.id}><span>{formatDate(game.createdAt)}</span><b>{game.mode === 'bot' ? 'House bot' : 'Local game'}</b><em>{game.result}</em><i>{game.moves.length} ply</i></Link>) : <div className="empty-state"><b>No games recorded yet.</b><p>Finish a local or bot game while signed in and the full score sheet will appear here.</p></div>}
        </section>
        <aside className="study-progress"><p className="eyebrow">Studies</p><h2>Notebook marks</h2>{puzzles.map((puzzle, index) => <div key={puzzle.id} className={completed.includes(puzzle.id) ? 'completed-study' : ''}><span>{String(index + 1).padStart(2, '0')}</span><b>{puzzle.title}</b><em>{completed.includes(puzzle.id) ? 'Solved' : 'Open'}</em></div>)}<Link className="text-link" to="/puzzles">Visit study room →</Link></aside>
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
