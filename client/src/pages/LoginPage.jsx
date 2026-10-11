import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { readAuthForm } from '../lib/authForm'

const emptyRegistration = { username: '', email: '', password: '', confirmPassword: '' }
const emptyLogin = { identifier: '', password: '' }

export function LoginPage({ register = false }) {
  const { register: createAccount, signIn } = useSession()
  const [fields, setFields] = useState(register ? emptyRegistration : emptyLogin)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const title = register ? 'Create your club account' : 'Welcome back'
  const next = new URLSearchParams(location.search).get('next') || '/profile'

  function updateField(event) {
    setFields((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    const details = readAuthForm(new FormData(event.currentTarget).entries(), register)
    setFields(details)
    try {
      if (register) await createAccount(details)
      else await signIn(details)
      navigate(next.startsWith('/') ? next : '/profile', { replace: true })
    } catch (issue) {
      setError(issue.message || 'We could not open your account.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-aside">
        <span className="auth-piece">♞</span>
        <p className="eyebrow">The Citadel Club</p>
        <blockquote>“A game is a conversation. Keep the good ones.”</blockquote>
        <p className="auth-aside-note">Your scorebook, table settings, and completed studies belong to your club account.</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <p className="eyebrow">{register ? 'Membership' : 'Member sign in'}</p>
        <h1>{title}</h1>
        <p>{register ? 'Choose the details that will appear beside your scorebook.' : 'Sign in to continue your studies, settings, and game record.'}</p>

        {register ? (
          <>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" value={fields.username} onChange={updateField} autoComplete="username" placeholder="e.g. ibrahim_chess" required minLength="3" maxLength="20" autoFocus />
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" value={fields.email} onChange={updateField} autoComplete="email" placeholder="you@example.com" required />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={fields.password} onChange={updateField} autoComplete="new-password" placeholder="At least 8 characters" required minLength="8" />
            <label htmlFor="confirm-password">Repeat password</label>
            <input id="confirm-password" name="confirmPassword" type="password" value={fields.confirmPassword} onChange={updateField} autoComplete="new-password" placeholder="Repeat your password" required minLength="8" />
          </>
        ) : (
          <>
            <label htmlFor="identifier">Username or email</label>
            <input id="identifier" name="identifier" value={fields.identifier} onChange={updateField} autoComplete="username" placeholder="Username or email" required autoFocus />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={fields.password} onChange={updateField} autoComplete="current-password" placeholder="Your password" required />
          </>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Opening account…' : register ? 'Create account' : 'Sign in'}</button>
        <p className="auth-switch">{register ? 'Already have an account?' : 'New to the club?'} <Link to={`${register ? '/login' : '/register'}${location.search}`}>{register ? 'Sign in' : 'Create an account'}</Link></p>
        <p className="auth-local-note">Your password is never kept in the browser. A short-lived club session keeps this desk open.</p>
      </form>
    </section>
  )
}
