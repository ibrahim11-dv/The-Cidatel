import { useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Link } from 'react-router-dom'
import { ChessBoard } from '../components/ChessBoard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CapturedPieces, MoveLedger } from '../components/MoveLedger'
import { useSession } from '../context/SessionContext'
import { useStockfish } from '../hooks/useStockfish'
import { BOT_LEVELS, getBotLevel } from '../lib/botLevels'
import { getDrawClaim, materialBalance } from '../lib/chess'
import { LocalGame, TIME_CONTROLS, formatClock } from '../lib/localGame'
import { saveGame } from '../lib/storage'
import { unlockSound, playSound, moveSound } from '../lib/sound'

const SAVE_KEY = 'citadel:local-game'
function loadLocal(mode) {
  try {
    const data = mode === 'local' && JSON.parse(localStorage.getItem(SAVE_KEY))
    if (data) return LocalGame.restore(data)
  } catch { /* Invalid saved data must not prevent play. */ }
  return new LocalGame()
}

export function GamePage({ mode }) {
  const { session, boardOptions } = useSession()
  const soundEnabled = useRef(boardOptions.sound)
  soundEnabled.current = boardOptions.sound
  const [model] = useState(() => ({ current: loadLocal(mode) }))
  const [, render] = useState(0)
  const [humanColor, setHumanColor] = useState('w')
  const [colorChoice, setColorChoice] = useState('w')
  const [hintsAllowed, setHintsAllowed] = useState(true)
  const [hinting, setHinting] = useState(false)
  const [hint, setHint] = useState(null)
  const hintGeneration = useRef(0)
  const [difficultyId, setDifficultyId] = useState(BOT_LEVELS[1].id)
  const [thinking, setThinking] = useState(false)
  const [flipped, setFlipped] = useState(() => mode === 'local' && boardOptions.orientation === 'black')
  const [reviewPly, setReviewPly] = useState(null)
  const [importText, setImportText] = useState('')
  const [notice, setNotice] = useState('')
  const [claimIntended, setClaimIntended] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const savedRef = useRef(null)
  const difficulty = getBotLevel(difficultyId)
  const { status: engineStatus, error: engineError, requestMove, cancelSearch, restartEngine } = useStockfish(mode === 'bot')
  const current = model.current
  const game = current.chess
  const fen = game.fen()
  const history = game.history({ verbose: true })
  const outcome = current.result
  const clocks = current.clocks()
  const claim = getDrawClaim(game)
  const balance = materialBalance(game)
  const reviewing = reviewPly !== null
  const displayFen = reviewing ? (reviewPly === 0 ? current.initialFen : history[reviewPly - 1]?.after || fen) : fen
  const lastMove = history[(reviewing ? reviewPly : history.length) - 1]

  function refresh() { render((value) => value + 1) }
  function playMove(move) {
    if (reviewing || outcome || (mode === 'bot' && (thinking || game.turn() !== humanColor))) return false
    if (claimIntended) {
      const accepted = current.claimDraw(move)
      setClaimIntended(false)
      setNotice(accepted ? 'Draw claimed. The announced move was not played.' : 'That move does not establish a draw claim. The position is unchanged.')
      refresh()
      return accepted
    }
    if (soundEnabled.current) unlockSound()
    hintGeneration.current += 1
    if (hinting) cancelSearch()
    setHinting(false)
    setHint(null)
    const played = current.move(move)
    if (!played) { refresh(); return false }
    if (soundEnabled.current) playSound(current.result ? 'end' : moveSound(played))
    setNotice('')
    refresh()
    return true
  }
  function reset({ control = current.control, fen: position, pgn } = {}, afterReset) {
    let next
    try { next = new LocalGame({ control, fen: position, pgn }) }
    catch { setNotice('That FEN or PGN is invalid. The current game has been preserved.'); return false }
    const apply = () => {
      cancelSearch()
      hintGeneration.current += 1
      setHinting(false)
      setHint(null)
      model.current = next
      if (soundEnabled.current) { unlockSound(); playSound('start') }
      savedRef.current = null
      setReviewPly(null)
      setThinking(false)
      setClaimIntended(false)
      setNotice('')
      if (mode === 'bot') {
        const color = colorChoice === 'random' ? (crypto.getRandomValues(new Uint8Array(1))[0] % 2 ? 'w' : 'b') : colorChoice
        setHumanColor(color)
        setFlipped(color === 'b')
      }
      afterReset?.()
      refresh()
    }
    if ((history.length || current.started) && !outcome) {
      setConfirmation({ title: 'Start a new game?', message: 'This replaces your current game. Export its PGN first if you want to keep it.', confirmLabel: 'Start new game', action: apply })
    } else apply()
  }
  function finish(result) {
    current.tick()
    current.finish(result)
    if (soundEnabled.current) { unlockSound(); playSound('end') }
    cancelSearch()
    hintGeneration.current += 1
    setHinting(false)
    setThinking(false)
    refresh()
  }

  function takeBack() {
    if (!current.canTakeBack(humanColor)) return
    cancelSearch()
    hintGeneration.current += 1
    setHinting(false)
    setHint(null)
    setThinking(false)
    setReviewPly(null)
    setClaimIntended(false)
    const changed = current.takeBack(humanColor)
    setNotice(changed ? 'Your last move and the bot reply were taken back. Clocks return to before your move.' : 'The game has ended; a takeback is no longer available.')
    refresh()
  }

  function chooseDifficulty(id) {
    if (id === difficultyId) return
    reset({}, () => setDifficultyId(id))
  }

  async function showHint() {
    if (outcome || thinking || hinting || game.turn() !== humanColor || !hintsAllowed) return
    const generation = ++hintGeneration.current
    const requestedFen = fen
    setHinting(true)
    setHint(null)
    if (soundEnabled.current) unlockSound()
    try {
      const move = await requestMove({ initialFen: current.initialFen, moves: game.history() }, BOT_LEVELS.at(-1))
      if (generation !== hintGeneration.current || model.current !== current || game.fen() !== requestedFen || current.result || !move) return
      const preview = new Chess(requestedFen)
      const played = preview.move(move)
      setHint(played)
    } catch (error) { if (generation === hintGeneration.current) setNotice(error.message) }
    finally { if (generation === hintGeneration.current) setHinting(false) }
  }
  function exportGame(kind) {
    if (outcome) game.header('Result', outcome.startsWith('White wins') ? '1-0' : outcome.startsWith('Black wins') ? '0-1' : '1/2-1/2')
    const text = kind === 'fen' ? fen : game.pgn()
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `the-citadel.${kind}`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  useEffect(() => {
    const timer = setInterval(() => {
      if (!model.current.timed || !model.current.started || model.current.result) return
      model.current.tick()
      render((value) => value + 1)
    }, 200)
    return () => clearInterval(timer)
  }, [model])
  useEffect(() => {
    if (mode !== 'local') return
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(current.snapshot())) } catch { /* Play works without storage. */ }
  }, [mode, current, fen, outcome, current.started])
  useEffect(() => {
    if (mode !== 'bot' || engineStatus !== 'ready' || outcome || game.turn() === humanColor) return
    let active = true
    const requestedGame = current
    setThinking(true)
    requestMove({ initialFen: current.initialFen, moves: game.history() }, difficulty).then((move) => {
      if (!active || !move || model.current !== requestedGame || requestedGame.chess.fen() !== fen) return
      const played = requestedGame.move(move)
      if (played && soundEnabled.current) playSound(requestedGame.result ? 'end' : moveSound(played))
      refresh()
    }).catch((error) => { if (active) setNotice(error.message) })
      .finally(() => { if (active) setThinking(false) })
    return () => { active = false; cancelSearch() }
  }, [fen, mode, humanColor, difficulty, outcome, engineStatus, requestMove, cancelSearch, current, model])
  useEffect(() => {
    if (!outcome || savedRef.current === current) return
    saveGame({ id: current.id, ownerId: session?.id || 'guest', mode,
      createdAt: new Date(current.finishedAt || Date.now()).toISOString(), result: outcome, ownerColor: mode === 'bot' ? humanColor : 'w',
      initialFen: current.initialFen, moves: history, finalFen: fen })
    savedRef.current = current
  }, [outcome, current, session, mode, humanColor, history, fen])

  const playerName = (side) => mode === 'local' ? (side === 'w' ? 'White' : 'Black') : side === humanColor ? 'You' : `Stockfish · ${difficulty.label}`
  const status = outcome || engineError || notice || (thinking ? 'Stockfish is thinking…' : mode === 'bot' && engineStatus !== 'ready' ? 'Preparing Stockfish…' : `${playerName(game.turn())} ${game.isCheck() ? 'is in check' : 'to move'}`)
  const playerStrip = (side, top) => <div className={`players-strip ${top ? 'black-strip' : ''}`}>
    <span className="player-disc">{side === 'w' ? '♔' : '♚'}</span><b>{playerName(side)}</b>
    <em>{game.turn() === side && !outcome ? 'to move' : ''}</em>
    {current.timed && <strong className={`chess-clock ${game.turn() === side && !outcome ? 'running' : ''}`} aria-label={`${side === 'w' ? 'White' : 'Black'} clock`}>{formatClock(clocks[side])}</strong>}
  </div>

  return <section className="game-page">
    <div className="page-heading game-heading"><div><p className="eyebrow">{mode === 'local' ? 'The shared table' : 'The practice room'}</p><h1>{mode === 'local' ? 'Play locally' : 'Play against Stockfish'}</h1><p>{mode === 'local' ? 'Two players. One board. No account needed.' : 'A genuine chess engine, at your chosen strength.'}</p></div>
      <div className="game-settings">
        <label>Time control<select value={current.control} onChange={(event) => reset({ control: event.target.value })}>{TIME_CONTROLS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        {mode === 'local' && <label>Board view<select value={flipped ? 'b' : 'w'} onChange={(event) => setFlipped(event.target.value === 'b')}><option value="w">White at bottom</option><option value="b">Black at bottom</option></select></label>}
        {mode === 'bot' && <label>Your pieces<select value={colorChoice} onChange={(event) => { const choice = event.target.value; reset({}, () => { const color = choice === 'random' ? (crypto.getRandomValues(new Uint8Array(1))[0] % 2 ? 'w' : 'b') : choice; setColorChoice(choice); setHumanColor(color); setFlipped(color === 'b') }) }}><option value="w">White</option><option value="b">Black</option><option value="random">Random</option></select></label>}
      </div>
    </div>
    {mode === 'bot' && <><div className="bot-levels" role="radiogroup" aria-label="Choose a Stockfish difficulty">
      {BOT_LEVELS.map((level, index) => <button key={level.id} type="button" role="radio" aria-checked={level.id === difficultyId} className={level.id === difficultyId ? 'selected' : ''} onClick={() => chooseDifficulty(level.id)}>
        <span>0{index + 1}</span><b>{level.label}</b><small>{level.note}</small>
      </button>)}
    </div><div className="bot-setup-note"><div><p>{difficulty.note} Strength levels are not calibrated player ratings.</p><p className="engine-attribution">Powered by <a href="https://github.com/official-stockfish/Stockfish" target="_blank" rel="noreferrer">Stockfish 19</a> through <a href="https://github.com/nmrugg/stockfish.js" target="_blank" rel="noreferrer">Stockfish.js</a> · <a href="/stockfish/COPYING.txt" target="_blank" rel="noreferrer">GPL-3.0 license</a></p></div><label><input type="checkbox" checked={hintsAllowed} onChange={(event) => { setHintsAllowed(event.target.checked); if (!event.target.checked) { hintGeneration.current += 1; if (hinting) cancelSearch(); setHinting(false); setHint(null) } }} /> Allow hints</label></div></>}
    <nav className="table-navigation" aria-label="Play modes"><Link to="/play/local">Local</Link><Link to="/play/bot">Bots</Link><Link to="/online">Online</Link></nav>
    <div className="game-layout">
      {playerStrip(flipped ? 'w' : 'b', true)}
      <div className="playing-table"><ChessBoard fen={displayFen} onMove={playMove} flipped={flipped} interactive={!outcome && !reviewing && (mode === 'local' || (game.turn() === humanColor && !thinking))} lastMove={lastMove} arrows={hint ? [hint] : []} label="Game board" /></div>
      {playerStrip(flipped ? 'b' : 'w', false)}
      <aside className="score-panel">
        <div className="score-panel-top"><p className="eyebrow">Score sheet</p><span className={thinking ? 'thinking-dot' : ''} aria-live="polite">{status}</span></div>
        <MoveLedger history={history} activePly={reviewPly} onSelect={setReviewPly} />
        {reviewing && <div className="replay-controls"><button onClick={() => setReviewPly(0)}>Starting position</button><button onClick={() => setReviewPly(Math.max(0, reviewPly - 1))} disabled={!reviewPly}>Previous</button><button onClick={() => setReviewPly(Math.min(history.length, reviewPly + 1))} disabled={reviewPly === history.length}>Next</button><button onClick={() => setReviewPly(null)}>Return to game</button></div>}
        <CapturedPieces history={history} />
        <p className="material-note">{balance === 0 ? 'Material is equal' : `${balance > 0 ? 'White' : 'Black'} +${Math.abs(balance)} material`}</p>
        {outcome && <p className="result-note" role="status">{outcome}. Select a move to review the game.</p>}
        {mode === 'bot' && engineStatus === 'error' && <div className="engine-recovery"><p role="alert">{engineError}</p><button className="primary-button" onClick={() => { setNotice(''); restartEngine() }}>Restart engine</button></div>}
        {mode === 'bot' && <div className="game-actions"><button className="quiet-button" disabled={!current.canTakeBack(humanColor)} onClick={takeBack}>Take back</button>
          {hintsAllowed && <button className="quiet-button" disabled={!!outcome || reviewing || thinking || hinting || engineStatus !== 'ready' || game.turn() !== humanColor} onClick={showHint}>{hinting ? 'Finding a hint…' : 'Hint'}</button>}
        </div>}
        {hint && !outcome && <p className="result-note" role="status">Consider {hint.san}: {hint.from} to {hint.to}{hint.promotion ? `, promoting to ${hint.promotion}` : ''}.</p>}
        {current.timed && !current.started && !outcome && <button className="primary-button" onClick={() => { current.start(); refresh() }}>Start clock</button>}
        <div className="game-actions"><button className="primary-button" onClick={() => reset()}>{outcome ? 'Play again' : 'New game'}</button><button className="quiet-button" onClick={() => setFlipped(!flipped)}>Flip board</button>
          {!outcome && <button className="quiet-button" onClick={() => { const loser = mode === 'bot' ? humanColor : game.turn(); setConfirmation({ title: 'Resign this game?', message: `${loser === 'w' ? 'White' : 'Black'} will resign.`, confirmLabel: 'Resign', action: () => finish(`${loser === 'w' ? 'Black' : 'White'} wins by resignation`) }) }}>Resign</button>}
          {!outcome && mode === 'local' && <button className="quiet-button" onClick={() => setConfirmation({ title: 'Agree to a draw?', message: 'Both players must agree. Accepting ends this game as a draw.', confirmLabel: 'Both players agree', action: () => finish('Draw by agreement') })}>Agree draw</button>}
          {!outcome && (mode === 'local' || game.turn() === humanColor) && claim && <button className="quiet-button" onClick={() => { current.claimDraw(); refresh() }}>Claim draw</button>}
          {!outcome && !reviewing && (mode === 'local' || game.turn() === humanColor) && <button className="quiet-button" aria-pressed={claimIntended} onClick={() => { setClaimIntended(!claimIntended); setNotice('') }}>{claimIntended ? 'Cancel draw claim' : 'Claim with a move'}</button>}
          {outcome && <><Link className="quiet-button" to="/">Return to play menu</Link><Link className="quiet-button" to="/profile">Open scorebook</Link></>}
        </div>
        {claimIntended && <p className="result-note" role="status">Choose the move that would produce the third repetition or complete fifty moves without a pawn move or capture. It will be checked without playing it.</p>}
        <details className="position-tools"><summary>Position & game files</summary><button className="quiet-button" onClick={() => exportGame('fen')}>Export FEN</button><button className="quiet-button" onClick={() => exportGame('pgn')}>Export PGN</button>
          <label>Import FEN or PGN<textarea value={importText} onChange={(event) => setImportText(event.target.value)} /></label>
          <button className="quiet-button" disabled={!importText.trim()} onClick={() => reset(importText.trim().split(/\s/)[0].includes('/') ? { fen: importText.trim() } : { pgn: importText.trim() })}>Load position / game</button>
          <p className="small-note">Imported games start with fresh clocks. Local clocks continue while this page is closed.</p>
        </details>
        {notice && <p className="result-note" role="alert">{notice}</p>}
      </aside>
    </div>
    {confirmation && <ConfirmDialog {...confirmation} onCancel={() => setConfirmation(null)} onConfirm={() => { confirmation.action(); setConfirmation(null) }} />}
  </section>
}
