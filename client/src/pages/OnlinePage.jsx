import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chess } from 'chess.js'
import { useSession } from '../context/SessionContext'
import { gameApi } from '../lib/api'
import { TIME_CONTROLS } from '../lib/localGame'
import { ChessBoard } from '../components/ChessBoard'
import { MoveLedger, CapturedPieces } from '../components/MoveLedger'
import { ConfirmDialog } from '../components/ConfirmDialog'

export function OnlinePage() {
  const { session } = useSession()
  return session ? <PrivateTable key={session.id} account={session} /> : <section className="online-page"><h1>Play online</h1><p>Sign in to create or join a private game.</p><Link className="primary-button" to="/login">Sign in</Link></section>
}

function PrivateTable({ account }) {
  const key = `citadel-online-${account.id}`
  const [id, setId] = useState(() => localStorage.getItem(key) || '')
  const [game, setGame] = useState(null)
  const [room, setRoom] = useState(null)
  const [searching, setSearching] = useState(false)
  const queueRequest = useRef(null)
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('invite') || '')
  const [control, setControl] = useState('5+3')
  const [busy, setBusy] = useState(false)
  const [checkingActive, setCheckingActive] = useState(true)
  const [connected, setConnected] = useState(false)
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [flip, setFlip] = useState(false)
  const version = useRef(0)
  const pending = useRef(false)
  const accept = (state) => { setSearching(false); setGame(state); setId(state.id); localStorage.setItem(key, state.id); setConnected(true) }
  useEffect(() => {
    let cancelled = false
    gameApi.active().then((state) => {
      if (!cancelled && state) accept(state)
    }).catch((error) => { if (!cancelled) setNotice(error.message) })
      .finally(() => { if (!cancelled) setCheckingActive(false) })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    if (!id && !room && !searching) return
    let cancelled = false, timer
    async function sync() {
      if (pending.current) { timer = setTimeout(sync, 750); return }
      const current = version.current
      try {
        let state
        if (id) state = await gameApi.state(id)
        else if (room) state = await gameApi.invitation(room.code)
        else {
          const [minutes, increment] = control.split('+').map(Number)
          queueRequest.current = gameApi.matchmaking(minutes * 60, increment)
          state = await queueRequest.current
        }
        if (!cancelled && current === version.current) {
          if (id) accept(state)
          else if (state.gameId) { setSearching(false); setId(state.gameId) }
          setConnected(true)
        }
      } catch (error) {
        if (!cancelled && current === version.current) { setConnected(false); setNotice(error.message) }
      }
      if (!cancelled) timer = setTimeout(sync, 750)
    }
    sync()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [id, room?.code, searching, control])
  async function action(work) {
    if (pending.current || checkingActive) return
    pending.current = true
    setBusy(true); setNotice(''); version.current++
    try { await work() } catch (error) { setNotice(error.message); setConnected(false) }
    finally { version.current++; pending.current = false; setBusy(false) }
  }
  const history = useMemo(() => {
    const chess = new Chess()
    for (const move of game?.moves || []) chess.move({ from: move.slice(0, 2), to: move.slice(2, 4), ...(move[4] ? { promotion: move[4] } : {}) })
    return chess.history({ verbose: true })
  }, [game?.moves?.join(',')])
  const white = game?.white === account.id
  const flipped = flip !== !white
  const myTurn = game && new Chess(game.fen).turn() === (white ? 'w' : 'b')
  function clock(side) {
    const seconds = Math.ceil(game.clocks[`${side}Millis`] / 1000)
    return <div className="player-strip"><span>{side} · {(side === 'white') === white ? account.username : 'Opponent'}</span><strong className={`chess-clock ${game.clocks.running === side.toUpperCase() ? 'running' : ''}`}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</strong></div>
  }
  return <section className="online-page">
    <header className="page-heading"><p className="eyebrow">The online room</p><h1>Play online</h1><p>{game ? connected ? 'Connected · synchronized with the server' : 'Reconnecting…' : 'Find an opponent or invite a friend. Private-game hosts play White.'}</p></header>
    {notice && <p role="alert">{notice}</p>}
    {checkingActive && <p role="status">Checking for an active game…</p>}
    {game ? <div className="game-layout"><div>
      {clock(flipped ? 'white' : 'black')}
      <ChessBoard fen={game.fen} flipped={flipped} lastMove={history.at(-1)} interactive={connected && !busy && !game.result && myTurn} onMove={(move) => action(async () => accept(await gameApi.move(id, { commandId: crypto.randomUUID(), expectedPly: game.moves.length, move: `${move.from}${move.to}${move.promotion || ''}` })))} />
      {clock(flipped ? 'black' : 'white')}<CapturedPieces history={history} />
    </div><aside className="game-panel"><h2>{game.result ? `${game.result.score} · ${game.result.reason}` : myTurn ? 'Your move' : 'Opponent to move'}</h2>
      <button className="quiet-button" onClick={() => setFlip(!flip)}>Flip board</button>
      {!game.result && <button className="quiet-button" disabled={busy || !connected} onClick={() => setConfirm(true)}>Resign</button>}
      {!game.result && (game.drawOfferedBy ? game.drawOfferedBy === account.id ? <p role="status">Draw offered. Waiting for your opponent.</p> : <div role="group" aria-label="Opponent draw offer"><p>Your opponent offers a draw.</p><button className="primary-button" disabled={busy || !connected} onClick={() => action(async () => accept(await gameApi.respondToDraw(id, true)))}>Accept draw</button><button className="quiet-button" disabled={busy || !connected} onClick={() => action(async () => accept(await gameApi.respondToDraw(id, false)))}>Decline draw</button></div> : <button className="quiet-button" disabled={busy || !connected} onClick={() => action(async () => accept(await gameApi.offerDraw(id)))}>Offer draw</button>)}
      <MoveLedger history={history} />
      {game.result && <button className="primary-button" onClick={() => { version.current++; localStorage.removeItem(key); setGame(null); setId(''); setRoom(null) }}>Return to online room</button>}
    </aside></div> : id ? <><p role="status">Restoring your game…</p>{!connected && <button className="quiet-button" onClick={() => { version.current++; localStorage.removeItem(key); setId('') }}>Return to online room</button>}</> : <div className="online-layout">
      {searching ? <article className="room-card"><h2>Finding an opponent</h2><p role="status">Waiting for a player at {control.replace('+', ' + ')}. Colors are assigned randomly.</p><button className="quiet-button" disabled={busy} onClick={() => action(async () => {
        await queueRequest.current?.catch(() => {})
        const state = await gameApi.cancelMatchmaking()
        setSearching(false)
        if (state.gameId) setId(state.gameId)
      })}>Cancel matchmaking</button></article> : <article className="room-card"><h2>Invite a friend</h2>{room ? <>
        <p>Waiting for your opponent. Share this link:</p><input aria-label="Invitation link" readOnly value={`${location.origin}${location.pathname}?invite=${room.code}`} onFocus={(event) => event.target.select()} />
        <button className="quiet-button" disabled={busy} onClick={() => action(async () => { await gameApi.cancel(room.code); setRoom(null) })}>Cancel invitation</button>
      </> : <><label htmlFor="online-time">Time control</label><select id="online-time" value={control} onChange={(event) => setControl(event.target.value)}>{TIME_CONTROLS.filter(([value]) => value !== '0+0').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className="primary-button" disabled={busy || checkingActive} onClick={() => { setNotice(''); setSearching(true) }}>Find an opponent</button>
        <button className="quiet-button" disabled={busy || checkingActive} onClick={() => action(async () => { const [minutes, increment] = control.split('+').map(Number); setRoom(await gameApi.create(minutes * 60, increment)) })}>Create invitation</button></>}
      </article>}<article className="room-card"><h2>Join a friend</h2><label htmlFor="online-code">Invitation code</label><input id="online-code" value={code} onChange={(event) => setCode(event.target.value)} /><button className="primary-button" disabled={busy || checkingActive || searching || !code.trim() || !!room} onClick={() => action(async () => accept(await gameApi.join(code.trim())))}>Join game</button></article>
    </div>}
    {confirm && <ConfirmDialog title="Resign this game?" message="Your opponent will win." confirmLabel="Resign" onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); action(async () => accept(await gameApi.resign(id))) }} />}
  </section>
}
