import { createContext, useContext, useEffect, useState } from 'react'
import {
  clearSession,
  getSession,
  saveAuthenticatedSession,
  updateSavedSession,
  getGuestPreferences,
  saveGuestPreferences,
} from '../lib/storage'
import { accountApi, authApi } from '../lib/api'
import { readBoardOptions, normalizeBoardOptions, saveBoardOptions } from '../lib/boardOptions'
import { applyTheme, readTheme, saveCustomColors } from '../lib/themes'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => getSession())
  const [boardOptions, setBoardOptions] = useState(readBoardOptions)
  const [guestPreferences, setGuestPreferences] = useState(getGuestPreferences)
  const accountColorsKey = JSON.stringify(session?.preferences?.customColors || {})
  const accountTheme = session?.preferences?.siteTheme

  useEffect(() => {
    if (!session) return
    const colors = session.preferences?.customColors || {}
    saveCustomColors(colors)
    applyTheme(accountTheme || readTheme(), colors)
  }, [session?.id, accountColorsKey, accountTheme])

  useEffect(() => {
    if (!session) return undefined

    let active = true
    accountApi.me()
      .then((account) => {
        if (active) setSession(updateSavedSession(account))
      })
      .catch((error) => {
        if (active && error.status === 401) {
          clearSession()
          setSession(null)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const value = {
    session,
    boardOptions,
    updateBoardOptions(patch) {
      const next = normalizeBoardOptions({ ...boardOptions, ...patch })
      setBoardOptions(next)
      return saveBoardOptions(next)
    },
    preferences: session?.preferences || guestPreferences,
    async register(details) {
      if (details.password !== details.confirmPassword) {
        throw new Error('The passwords do not match.')
      }
      const authenticated = await authApi.register(details)
      const next = saveAuthenticatedSession(authenticated)
      setSession(next)
      return next
    },
    async signIn(details) {
      const authenticated = await authApi.login(details)
      const next = saveAuthenticatedSession(authenticated)
      setSession(next)
      return next
    },
    signOut() {
      clearSession()
      setSession(null)
    },
    async updateAccount(details) {
      const account = await accountApi.updateIdentity(details)
      const next = updateSavedSession(account)
      setSession(next)
      return next
    },
    async changePassword(details) {
      if (details.newPassword !== details.confirmPassword) {
        throw new Error('The new passwords do not match.')
      }
      const account = await accountApi.changePassword(details)
      const next = updateSavedSession(account)
      setSession(next)
      return next
    },
    async setPreferences(patch) {
      if (!session) {
        const next = { ...guestPreferences, ...patch }
        setGuestPreferences(next)
        try { saveGuestPreferences(next) }
        catch { throw new Error('Pieces applied, but browser storage is unavailable.') }
        return next
      }
      const account = await accountApi.updateAppearance({ ...session.preferences, ...patch })
      const next = updateSavedSession(account)
      setSession(next)
      return next
    },
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used inside SessionProvider')
  return context
}
