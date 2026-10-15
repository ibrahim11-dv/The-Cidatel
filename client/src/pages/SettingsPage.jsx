import { useEffect, useState } from 'react'
import { ChessBoard } from '../components/ChessBoard'
import { STARTING_FEN } from '../lib/chess'
import { THEMES, applyTheme, readTheme } from '../lib/themes'
import { BACKGROUND_PRESETS } from '../lib/backgrounds'
import { useSession } from '../context/SessionContext'
import { useBackground } from '../context/BackgroundContext'
import { DEFAULT_BOARD_OPTIONS } from '../lib/boardOptions'
import { unlockSound, playSound } from '../lib/sound'

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

export function SettingsPage() {
  const { session, preferences, setPreferences, boardOptions, updateBoardOptions } = useSession()
  const { background, uploadUrl, hasUploadedBackground, usePreset, useUpload, useUploadedBackground, resetBackground } = useBackground()
  const [theme, setTheme] = useState(() => session?.preferences?.siteTheme || readTheme())
  const [savingTheme, setSavingTheme] = useState(false)
  const [savingAppearance, setSavingAppearance] = useState(false)
  const [savingBoard, setSavingBoard] = useState(false)
  const [notice, setNotice] = useState('Selections are saved on this browser, including for guests.')

  useEffect(() => {
    if (!session) return
    const savedTheme = preferences.siteTheme || 'walnut'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [session?.id, preferences.siteTheme])

  async function chooseTheme(id) {
    if (savingTheme) return
    applyTheme(id)
    setTheme(id)
    try {
      localStorage.setItem('citadel:theme', id)
      setNotice(session ? 'Site palette applied. Saving it to your account…' : 'Site palette saved on this browser.')
    } catch {
      setNotice('Site palette applied, but browser storage is unavailable.')
    }
    if (!session) return
    setSavingTheme(true)
    try {
      await setPreferences({ siteTheme: id })
      setNotice('Site palette saved to your account.')
    } catch (error) {
      setNotice(`${error.message} Your preview remains available on this browser.`)
    } finally {
      setSavingTheme(false)
    }
  }

  async function chooseAppearance(patch) {
    if (savingAppearance) return
    setSavingAppearance(true)
    try {
      await setPreferences(patch)
      setNotice(session ? 'Board appearance saved to your account.' : 'Board appearance saved on this browser.')
    } catch (error) {
      setNotice(error.message)
    } finally {
      setSavingAppearance(false)
    }
  }

  async function option(patch) {
    setSavingBoard(true)
    try {
      const saved = await updateBoardOptions(patch)
      setNotice(session ? 'Board preferences saved to your account.' : saved ? 'Board preferences saved on this browser.' : 'Preferences applied but browser storage is unavailable.')
    } catch (error) {
      setNotice(`${error.message} Your board settings remain applied on this browser.`)
    } finally {
      setSavingBoard(false)
    }
    if (patch.sound) { unlockSound(); playSound('move') }
  }

  async function chooseBackground(id) {
    try {
      await usePreset(id)
      setNotice('Background saved on this browser.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function uploadBackground(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await useUpload(file)
      setNotice('Uploaded background saved on this browser.')
    } catch (error) {
      setNotice(error.message)
    } finally {
      event.target.value = ''
    }
  }

  async function resetChosenBackground() {
    try {
      await resetBackground()
      setNotice('Background reset to Parchment.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  return <section>
    <header className="page-heading"><p className="eyebrow">Your club, your materials</p><h1>Appearance</h1><p>Choose a finished look for the club and board. Every option is designed to remain readable.</p></header>

    <section className="board-settings" aria-label="Site palette"><h2>Site palette</h2>
      <p>Choose one of the club’s prepared palettes.</p>
      <div className="theme-grid">{THEMES.map((item) => <button key={item.id} className={`theme-choice ${theme === item.id ? 'selected' : ''}`} aria-pressed={theme === item.id} disabled={savingTheme} onClick={() => void chooseTheme(item.id)}>
        <span className="theme-swatch" style={{ background: item.colors['--paper'] }}><i style={{ background: item.colors['--wood-light'] }} /><i style={{ background: item.colors['--wood-dark'] }} /><i style={{ background: item.colors['--brass'] }} /></span><b>{item.name}</b>
      </button>)}</div>
      <button className="quiet-button" disabled={savingTheme} onClick={() => void chooseTheme('walnut')}>Reset to Classic Walnut</button>
    </section>

    <section className="board-settings" aria-label="Site background"><h2>Background</h2>
      <p>Use a prepared club backdrop or add one image from this browser.</p>
      <div className="background-grid">{BACKGROUND_PRESETS.map((item) => <button key={item.id} type="button" className={`background-choice ${background.kind === 'preset' && background.id === item.id ? 'selected' : ''}`} aria-label={`${item.name} background`} aria-pressed={background.kind === 'preset' && background.id === item.id} onClick={() => void chooseBackground(item.id)}>
        <span style={{ backgroundImage: item.image }} /><b>{item.name}</b>
      </button>)}
        {hasUploadedBackground && <button type="button" className={`background-choice ${background.kind === 'upload' ? 'selected' : ''}`} aria-label="Use uploaded background" aria-pressed={background.kind === 'upload'} onClick={() => void useUploadedBackground().then(() => setNotice('Uploaded background selected.')).catch((error) => setNotice(error.message))}>
          <span style={uploadUrl ? { backgroundImage: `url("${uploadUrl}")` } : undefined} /><b>Your upload</b>
        </button>}
      </div>
      <label className="background-upload">Upload background image
        <input aria-label="Upload background image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadBackground(event)} />
        <small>PNG, JPEG, or WebP, up to 5 MB. It stays on this browser.</small>
      </label>
      <button className="quiet-button" type="button" onClick={() => void resetChosenBackground()}>Reset background</button>
    </section>

    <section className="appearance-studio board-appearance-studio" aria-label="Board and piece appearance">
      <div className="appearance-preview"><ChessBoard fen={STARTING_FEN} interactive={false} label="Board appearance preview" /></div>
      <div className="appearance-controls">
        <fieldset><legend>Board palette</legend><div className="choice-grid">{boardThemes.map(([value, name, description]) => <button className={`appearance-choice board-choice board-choice-${value} ${preferences.boardTheme === value ? 'selected' : ''}`} type="button" disabled={savingAppearance} onClick={() => void chooseAppearance({ boardTheme: value })} key={value}><span /><b>{name}</b><small>{description}</small></button>)}</div></fieldset>
        <fieldset><legend>Piece style</legend><div className="choice-grid compact">{pieceStyles.map(([value, name, description]) => <button className={`appearance-choice ${preferences.pieceStyle === value ? 'selected' : ''}`} type="button" disabled={savingAppearance} onClick={() => void chooseAppearance({ pieceStyle: value })} key={value}><b>{name}</b><small>{description}</small></button>)}</div></fieldset>
        <fieldset><legend>Piece tone</legend><div className="tone-row">{pieceTones.map(([value, name]) => <button className={`tone-choice tone-${value} ${preferences.pieceTone === value ? 'selected' : ''}`} type="button" disabled={savingAppearance} onClick={() => void chooseAppearance({ pieceTone: value })} key={value}><i>♟</i>{name}</button>)}</div></fieldset>
      </div>
    </section>

    <section className="board-settings" aria-label="Board preferences"><h2>At the board</h2>
      <label><input disabled={savingBoard} type="checkbox" checked={boardOptions.coordinates} onChange={(event) => void option({ coordinates: event.target.checked })} /> Board coordinates</label>
      <label><input disabled={savingBoard} type="checkbox" checked={boardOptions.legalMoves} onChange={(event) => void option({ legalMoves: event.target.checked })} /> Show legal moves</label>
      <label><input disabled={savingBoard} type="checkbox" checked={boardOptions.sound} onChange={(event) => void option({ sound: event.target.checked })} /> Move and game sounds</label>
      <label>Movement speed<select disabled={savingBoard} value={boardOptions.animationMs} onChange={(event) => void option({ animationMs: Number(event.target.value) })}><option value="0">Instant</option><option value="100">Fast</option><option value="160">Natural</option><option value="240">Relaxed</option></select></label>
      <label>Local board orientation<select disabled={savingBoard} value={boardOptions.orientation} onChange={(event) => void option({ orientation: event.target.value })}><option value="white">White at the bottom</option><option value="black">Black at the bottom</option></select></label>
      <p className="small-note">Reduced-motion preferences override animation speed. {session ? 'These controls follow your club account.' : 'These controls are saved on this browser.'}</p>
      <button className="quiet-button" disabled={savingBoard} onClick={() => void option(DEFAULT_BOARD_OPTIONS)}>Reset board preferences</button>
    </section>
    <p role="status" className="small-note appearance-notice">{notice}</p>
  </section>
}
