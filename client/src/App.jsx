import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SessionProvider, useSession } from './context/SessionContext'
import { Shell } from './components/Shell'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { GamePage } from './pages/GamePage'
import { HistoryPage } from './pages/HistoryPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { OnlinePage } from './pages/OnlinePage'
import { ProfilePage } from './pages/ProfilePage'
import { GuestProfilePage } from './pages/GuestProfilePage'
import { PuzzlesPage } from './pages/PuzzlesPage'
import { SettingsPage } from './pages/SettingsPage'
import { signInDestination } from './lib/authRedirect'

function RequireSession({ children }) {
  const { session } = useSession()
  const location = useLocation()
  if (!session) return <Navigate to={signInDestination(location)} replace />
  return children
}

function NotFound() {
  return <section className="not-found"><p className="eyebrow">Lost position</p><h1>There is no board here.</h1><p>Return to the club room and choose a table.</p><Link className="primary-button" to="/">Return home</Link></section>
}

function PlayerProfile() {
  const { session } = useSession()
  return session ? <ProfilePage /> : <GuestProfilePage />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <SessionProvider>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/play/local" element={<GamePage key="local" mode="local" />} />
              <Route path="/play/bot" element={<GamePage key="bot" mode="bot" />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<LoginPage register />} />
              <Route path="/online" element={<RequireSession><OnlinePage /></RequireSession>} />
              <Route path="/puzzles" element={<PuzzlesPage />} />
              <Route path="/profile" element={<PlayerProfile />} />
              <Route path="/history/:gameId" element={<HistoryPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </SessionProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  )
}
