import { createContext, useContext, useEffect, useState } from 'react'
import {
  applyBackground,
  choosePreset,
  loadUploadedBackground,
  readBackgroundChoice,
  resetBackground,
  saveUploadedBackground,
} from '../lib/backgrounds'

const BackgroundContext = createContext(null)

export function BackgroundProvider({ children }) {
  const [background, setBackground] = useState(readBackgroundChoice)
  const [uploadUrl, setUploadUrl] = useState(null)
  const [hasUploadedBackground, setHasUploadedBackground] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl = null
    async function restoreUpload() {
      try {
        const image = await loadUploadedBackground()
        if (!active || !image) return
        objectUrl = URL.createObjectURL(image)
        setUploadUrl(objectUrl)
        setHasUploadedBackground(true)
        if (background.kind === 'upload') applyBackground(background, objectUrl)
      } catch {
        if (active && background.kind === 'upload') applyBackground({ kind: 'preset', id: 'parchment' })
      }
    }
    applyBackground(background, uploadUrl)
    void restoreUpload()
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  async function usePreset(id) {
    const choice = choosePreset(id)
    setBackground(choice)
    applyBackground(choice)
  }

  async function useUpload(file) {
    const choice = await saveUploadedBackground(file)
    const nextUrl = URL.createObjectURL(file)
    if (uploadUrl) URL.revokeObjectURL(uploadUrl)
    setUploadUrl(nextUrl)
    setHasUploadedBackground(true)
    setBackground(choice)
    applyBackground(choice, nextUrl)
  }

  async function useUploadedBackground() {
    if (!uploadUrl) throw new Error('Your uploaded background is not available in this browser.')
    const choice = { kind: 'upload' }
    try { localStorage.setItem('citadel:background', JSON.stringify(choice)) } catch { throw new Error('Browser storage is unavailable.') }
    setBackground(choice)
    applyBackground(choice, uploadUrl)
  }

  async function reset() {
    const choice = await resetBackground()
    if (uploadUrl) URL.revokeObjectURL(uploadUrl)
    setUploadUrl(null)
    setHasUploadedBackground(false)
    setBackground(choice)
  }

  return <BackgroundContext.Provider value={{
    background,
    uploadUrl,
    hasUploadedBackground,
    usePreset,
    useUpload,
    useUploadedBackground,
    resetBackground: reset,
  }}>{children}</BackgroundContext.Provider>
}

export function useBackground() {
  const context = useContext(BackgroundContext)
  if (!context) throw new Error('useBackground must be used inside BackgroundProvider')
  return context
}
