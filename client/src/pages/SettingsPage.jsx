import { useState } from 'react'
import { ChessBoard } from '../components/ChessBoard'
import { STARTING_FEN } from '../lib/chess'
import { THEMES, applyTheme, readTheme } from '../lib/themes'
import { useSession } from '../context/SessionContext'
import { DEFAULT_BOARD_OPTIONS } from '../lib/boardOptions'
import { unlockSound, playSound } from '../lib/sound'

export function SettingsPage() {
  const { boardOptions, updateBoardOptions } = useSession()
  const [theme, setTheme] = useState(readTheme)
  const [notice, setNotice] = useState('Saved on this browser, including for guests.')
  function choose(id) {
    applyTheme(id)
    setTheme(id)
    try { localStorage.setItem('citadel:theme', id); setNotice('Appearance saved on this browser.') }
    catch { setNotice('Appearance applied. Browser storage is unavailable, so it cannot be saved.') }
  }
  function option(patch) {
    setNotice(updateBoardOptions(patch) ? 'Board preferences saved on this browser.' : 'Preferences applied but browser storage is unavailable.')
    if (patch.sound) { unlockSound(); playSound('move') }
  }
  return <section><header className="page-heading"><p className="eyebrow">Your club, your colors</p><h1>Appearance</h1><p>Choose the materials and atmosphere for your next game.</p></header>
    <div className="appearance-studio"><ChessBoard fen={STARTING_FEN} interactive={false} label="Theme preview" />
      <div><div className="theme-grid">{THEMES.map((item) => <button key={item.id} className={`theme-choice ${theme === item.id ? 'selected' : ''}`} aria-pressed={theme === item.id} onClick={() => choose(item.id)}>
        <span className="theme-swatch" style={{ background: item.colors['--paper'] }}><i style={{ background: item.colors['--wood-light'] }} /><i style={{ background: item.colors['--wood-dark'] }} /><i style={{ background: item.colors['--brass'] }} /></span><b>{item.name}</b>
      </button>)}</div><p role="status" className="small-note">{notice}</p><button className="quiet-button" onClick={() => choose('walnut')}>Reset to Classic Walnut</button></div>
    </div>
    <section className="board-settings" aria-label="Board preferences"><h2>At the board</h2>
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
