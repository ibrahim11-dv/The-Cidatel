import { useEffect, useState } from 'react'
import { ChessBoard } from '../components/ChessBoard'
import { STARTING_FEN } from '../lib/chess'
import { THEMES, applyTheme, readTheme, CUSTOM_COLORS, normalizeColors, readCustomColors, saveCustomColors, themeColors } from '../lib/themes'
import { useSession } from '../context/SessionContext'
import { DEFAULT_BOARD_OPTIONS } from '../lib/boardOptions'
import { unlockSound, playSound } from '../lib/sound'
import { colorContrastIssues } from '../lib/colorContrast'

export function SettingsPage() {
  const { session, preferences, setPreferences, boardOptions, updateBoardOptions } = useSession()
  const [savingPieces, setSavingPieces] = useState(false)
  async function choosePieces(patch) {
    setSavingPieces(true)
    try {
      await setPreferences(patch)
      setNotice(session ? 'Piece preferences saved to your account.' : 'Piece preferences saved on this browser.')
    } catch (error) { setNotice(error.message) }
    finally { setSavingPieces(false) }
  }
  const [theme, setTheme] = useState(() => session?.preferences?.siteTheme || readTheme())
  const [custom, setCustom] = useState(() => session?.preferences?.customColors || readCustomColors())
  const [colorsDirty, setColorsDirty] = useState(false)
  const [savingColors, setSavingColors] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const accountColorsKey = JSON.stringify(preferences.customColors || {})
  useEffect(() => {
    if (!session) return
    const saved = preferences.customColors || {}
    setCustom(saved)
    setColorsDirty(false)
  }, [session?.id, accountColorsKey])
  useEffect(() => {
    if (!session) return
    const savedTheme = preferences.siteTheme || 'walnut'
    setTheme(savedTheme)
    applyTheme(savedTheme, preferences.customColors || {})
  }, [session?.id, preferences.siteTheme])
  const colors = themeColors(theme, custom)
  const contrastIssues = colorContrastIssues(colors)
  function customize(value) {
    const next = normalizeColors(value)
    setCustom(next)
    applyTheme(theme, next)
    const saved = saveCustomColors(next)
    setColorsDirty(Boolean(session))
    setNotice(session ? 'Custom colors applied. Save them to your account when ready.' : saved ? 'Custom colors saved on this browser.' : 'Colors applied but browser storage is unavailable.')
  }
  async function saveAccountColors() {
    setSavingColors(true)
    try {
      await setPreferences({ customColors: custom })
      setColorsDirty(false)
      setNotice('Custom colors saved to your account.')
    } catch (error) { setNotice(`${error.message} Your preview remains available on this browser.`) }
    finally { setSavingColors(false) }
  }
  const [notice, setNotice] = useState('Saved on this browser, including for guests.')
  async function choose(id) {
    if (savingTheme) return
    applyTheme(id, custom)
    setTheme(id)
    try { localStorage.setItem('citadel:theme', id); setNotice(session ? 'Appearance applied. Saving it to your account…' : 'Appearance saved on this browser.') }
    catch { setNotice('Appearance applied. Browser storage is unavailable, so it cannot be saved.') }
    if (!session) return
    setSavingTheme(true)
    try {
      await setPreferences({ siteTheme: id })
      setNotice('Appearance saved to your account.')
    } catch (error) { setNotice(`${error.message} Your preview remains available on this browser.`) }
    finally { setSavingTheme(false) }
  }
  function option(patch) {
    setNotice(updateBoardOptions(patch) ? 'Board preferences saved on this browser.' : 'Preferences applied but browser storage is unavailable.')
    if (patch.sound) { unlockSound(); playSound('move') }
  }
  return <section><header className="page-heading"><p className="eyebrow">Your club, your colors</p><h1>Appearance</h1><p>Choose the materials and atmosphere for your next game.</p></header>
    <div className="appearance-studio"><ChessBoard fen={STARTING_FEN} interactive={false} label="Theme preview" />
      <div><div className="theme-grid">{THEMES.map((item) => <button key={item.id} className={`theme-choice ${theme === item.id ? 'selected' : ''}`} aria-pressed={theme === item.id} disabled={savingTheme} onClick={() => void choose(item.id)}>
        <span className="theme-swatch" style={{ background: item.colors['--paper'] }}><i style={{ background: item.colors['--wood-light'] }} /><i style={{ background: item.colors['--wood-dark'] }} /><i style={{ background: item.colors['--brass'] }} /></span><b>{item.name}</b>
      </button>)}</div><p role="status" className="small-note">{notice}</p><button className="quiet-button" disabled={savingTheme} onClick={() => void choose('walnut')}>Reset to Classic Walnut</button></div>
    </div>
    <section className="board-settings" aria-label="Custom colors"><h2>Make it yours</h2>
      <p>Custom colors stay applied when you change presets. Reset them to see the original palette. Choose contrasting text and background colors.</p>
      {CUSTOM_COLORS.map(([key, label]) => <label key={key}>{label}<input type="color" value={colors[key]} onChange={(event) => customize({ ...custom, [key]: event.target.value })} /></label>)}
      <div role="status">{contrastIssues.length ? <><p>Some text may be hard to read. Aim for at least 4.5:1 contrast for normal text.</p><ul>{contrastIssues.map(({ label, ratio }) => <li key={label}>{label}: {ratio.toFixed(2)}:1</li>)}</ul></> : <p>Main text and button colors meet the 4.5:1 contrast target.</p>}</div>
      <p className="small-note">This checks solid text colors, not every board marker, texture or interaction state.</p>
      <button className="quiet-button" onClick={() => customize({})}>Reset custom colors</button>
      {session && <button className="primary-button" disabled={!colorsDirty || savingColors} onClick={() => void saveAccountColors()}>{savingColors ? 'Saving colors…' : 'Save custom colors to account'}</button>}
    </section>
    <section className="board-settings" aria-label="Board preferences"><h2>At the board</h2>
      <label>Piece rendering<select value={preferences.pieceStyle} disabled={savingPieces} onChange={(event) => choosePieces({ pieceStyle: event.target.value })}><option value="classic">Classic outline</option><option value="modern">Fine outline</option><option value="manuscript">Bold outline</option></select></label>
      <label>Piece tone<select value={preferences.pieceTone} disabled={savingPieces} onChange={(event) => choosePieces({ pieceTone: event.target.value })}><option value="ivory">Ivory</option><option value="ebony">Ebony</option><option value="brass">Brass</option></select></label>
      <label><input type="checkbox" checked={boardOptions.coordinates} onChange={(event) => option({ coordinates: event.target.checked })} /> Board coordinates</label>
      <label><input type="checkbox" checked={boardOptions.legalMoves} onChange={(event) => option({ legalMoves: event.target.checked })} /> Show legal moves</label>
      <label><input type="checkbox" checked={boardOptions.sound} onChange={(event) => option({ sound: event.target.checked })} /> Move and game sounds</label>
      <label>Movement speed<select value={boardOptions.animationMs} onChange={(event) => option({ animationMs: Number(event.target.value) })}><option value="0">Instant</option><option value="100">Fast</option><option value="160">Natural</option><option value="240">Relaxed</option></select></label>
      <label>Local board orientation<select value={boardOptions.orientation} onChange={(event) => option({ orientation: event.target.value })}><option value="white">White at the bottom</option><option value="black">Black at the bottom</option></select></label>
      <p className="small-note">Reduced-motion preferences override animation speed. These controls are saved on this browser.</p>
      <button className="quiet-button" onClick={() => option(DEFAULT_BOARD_OPTIONS)}>Reset board preferences</button>
    </section>
  </section>
}
