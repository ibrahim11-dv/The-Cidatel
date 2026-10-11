import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { initials } from '../lib/chess'

const navItems = [
  ['Play', '/play/local'],
  ['Puzzles', '/puzzles'],
  ['Profile', '/profile'],
  ['Settings', '/settings'],
]

export function Shell() {
  const { session, signOut } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  function leave() {
    signOut()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <NavLink className="wordmark" to="/" aria-label="The Citadel home">
          <img className="citadel-mark" src="/citadel.svg" alt="" width="36" height="36" />
          <span>The Citadel</span>
        </NavLink>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map(([label, to]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </nav>
        {session ? (
          <div className="account-menu">
            <button className="avatar-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Open account menu">
              {initials(session.displayName)}
            </button>
            {menuOpen && (
              <div className="account-popover">
                <p>{session.displayName}</p>
                <NavLink to="/profile" onClick={() => setMenuOpen(false)}>Scorebook</NavLink>
                <button type="button" onClick={leave}>Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <NavLink className="text-link login-link" to="/login">Sign in</NavLink>
        )}
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="site-footer">
        <span>The Citadel</span>
        <span>Made for the long game.</span>
      </footer>
    </div>
  )
}
