import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chess } from 'chess.js'
import { useSession } from '../context/SessionContext'
import { gameApi } from '../lib/api'
import { TIME_CONTROLS } from '../lib/localGame'
import { ChessBoard } from '../components/ChessBoard'
import { MoveLedger, CapturedPieces } from '../components/MoveLedger'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { OnlineClock } from '../components/OnlineClock'
import { onlineRecord, onlineReview } from '../lib/onlineRecord'
import { premoveText } from '../lib/premove'

export function OnlinePage() {
  const { session } = useSession()
  return session ? <PrivateTable key={session.id} account={session} /> : <section className="online-page"><h1>Play online</h1><p>Sign in to create or join a private game.</p><Link className="primary-button" to="/login">Sign in</Link></section>
}

function PrivateTable({ account }) {
  const key = `citadel-online-${account.id}`
  const [id, setId] = useState(() => new URLSearchParams(location.search).get('game') || localStorage.getItem(key) || '')
  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState(null)
  const [rematch, setRematch] = useState(null)
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
  const [intendedMove, setIntendedMove] = useState('')
  const [premove, setPremove] = useState(null)
  const [review, setReview] = useState(null)
  useEffect(() => { setIntendedMove('') }, [game?.fen])
  const version = useRef(0)
  const pending = useRef(false)
  const queuedPremove = useRef(null)
  const accept = (state) => {
    setSearching(false)
    setGame({ ...state, receivedAt: performance.now() })
    setId(state.id)
    if (state.result) {
      localStorage.removeItem(key)
      queuedPremove.current = null
      setPremove(null)
    }
    else localStorage.setItem(key, state.id)
    setConnected(true)
  }
  useEffect(() => {
    setPlayers(null)
    if (!id) return
    let cancelled = false
    gameApi.players(id).then((names) => { if (!cancelled) setPlayers(names) })
      .catch((error) => { if (!cancelled) setNotice(error.message) })
    return () => { cancelled = true }
  }, [id])
  useEffect(() => {
    let cancelled = false
    gameApi.lobby().then((state) => {
      if (cancelled) return
      if (state.game) accept(state.game)
      else if (state.invitation) {
        localStorage.removeItem(key)
        setId('')
        setRoom(state.invitation)
        setControl(`${state.invitation.seconds / 60}+${state.invitation.increment}`)
      }
    }).catch((error) => { if (!cancelled) setNotice(error.message) })
      .finally(() => { if (!cancelled) setCheckingActive(false) })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    if (checkingActive || (!id && !room && !searching)) return
    let cancelled = false, timer
    async function sync() {
      if (pending.current) { timer = setTimeout(sync, 750); return }
      const current = version.current
      try {
        let state
        let offer = null
        if (id) {
          state = await gameApi.state(id)
          if (state.result) {
            offer = await gameApi.rematchStatus(id)
            if (offer.gameId) state = await gameApi.state(offer.gameId)
          }
        }
        else if (room) state = await gameApi.invitation(room.code)
        else {
          const [minutes, increment] = control.split('+').map(Number)
          queueRequest.current = gameApi.matchmaking(minutes * 60, increment)
          state = await queueRequest.current
        }
        if (!cancelled && current === version.current) {
          if (id) { accept(state); setRematch(state.result ? offer : null) }
          else if (state.gameId) { setSearching(false); setId(state.gameId) }
          setConnected(true)
        }
      } catch (error) {
        if (!cancelled && current === version.current) {
          setConnected(false); setNotice(error.message)
          if (room && !id && error.status === 404) setRoom(null)
        }
      }
      if (!cancelled) timer = setTimeout(sync, 750)
    }
    sync()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [id, room?.code, searching, control, checkingActive])
  async function action(work) {
    if (pending.current || checkingActive) return
    pending.current = true
    setBusy(true); setNotice(''); version.current++
    try { await work() } catch (error) { setNotice(error.message); setConnected(false) }
    finally { version.current++; pending.current = false; setBusy(false) }
  }
  async function rematchAction(cancel = false) {
    const offer = await (cancel ? gameApi.cancelRematch(id) : gameApi.requestRematch(id))
    if (offer.gameId) { accept(await gameApi.state(offer.gameId)); setRematch(null); setFlip(false) }
    else setRematch(offer)
  }
  const record = useMemo(() => onlineRecord(game?.moves, game?.result, players), [game?.moves?.join(','), game?.result?.score, players])
  const history = record.history
  const reviewing = review?.id === game?.id && review != null
  const displayed = onlineReview(record, reviewing ? review.ply : null)
  const selectPly = (ply) => setReview({ id: game.id, ply })
  function exportGame(kind) {
    const text = kind === 'fen' ? displayed.fen : record.pgn
    const url = URL.createObjectURL(new Blob([text], { type: kind === 'pgn' ? 'application/x-chess-pgn' : 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `the-citadel-${game.id}.${kind}`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const white = game?.white === account.id
  const flipped = flip !== !white
  const myTurn = game && new Chess(game.fen).turn() === (white ? 'w' : 'b')
  const claimMoves = useMemo(() => game ? new Chess(game.fen).moves({ verbose: true }) : [], [game?.fen])
  useEffect(() => {
    if (!premove || !game || game.result || !myTurn || !connected || pending.current) return
    const move = premove
    queuedPremove.current = null
    setPremove(null)
    action(async () => accept(await gameApi.move(id, { commandId: crypto.randomUUID(), expectedPly: game.moves.length, move: `${move.from}${move.to}${move.promotion || ''}` })))
  }, [premove, game?.fen, game?.moves?.length, game?.result, myTurn, connected, busy, id])
  function playOnlineMove(move) {
    if (!myTurn) {
      queuedPremove.current = move
      setPremove(move)
      setNotice(`Premove queued: ${premoveText(move)}. It will be checked by the server after your opponent moves.`)
      return true
    }
    void action(async () => accept(await gameApi.move(id, { commandId: crypto.randomUUID(), expectedPly: game.moves.length, move: `${move.from}${move.to}${move.promotion || ''}` })))
    return true
  }
  function clock(side) {
    return <div className="player-strip"><span>{side} · {players?.[side] || ((side === 'white') === white ? account.username : 'Opponent')}</span><OnlineClock clocks={game.clocks} side={side} receivedAt={game.receivedAt} finished={!!game.result} /></div>
  }
  return <section className="online-page">
    <header className="page-heading"><p className="eyebrow">The online room</p><h1>Play online</h1><p>{game ? connected ? 'Connected · synchronized with the server' : 'Reconnecting…' : 'Find an opponent or invite a friend. Private-game hosts play White.'}</p></header>
    {notice && <p role="alert">{notice}</p>}
    {checkingActive && <p role="status">Checking for an active game…</p>}
    {game ? <div className="game-layout online-game-layout"><div className="online-board-column">
      {clock(flipped ? 'white' : 'black')}
      {reviewing && <p role="status">Reviewing move {displayed.ply} of {history.length}.{!game.result && ' The live clocks continue.'}</p>}
      <ChessBoard fen={reviewing ? displayed.fen : game.fen} flipped={flipped} lastMove={displayed.lastMove} interactive={!reviewing && connected && !busy && !game.result} premoveColor={white ? 'w' : 'b'} onMove={playOnlineMove} />
      {clock(flipped ? 'black' : 'white')}<CapturedPieces history={displayed.history} />
    </div><aside className="game-panel"><h2>{game.result ? `${game.result.score} · ${game.result.reason}` : myTurn ? 'Your move' : 'Opponent to move'}</h2>
      <button className="quiet-button" onClick={() => setFlip(!flip)}>Flip board</button>
      {premove && !game.result && <p className="small-note" role="status">Queued premove: {premoveText(premove)} <button type="button" className="text-button" onClick={() => { queuedPremove.current = null; setPremove(null); setNotice('Premove cancelled.') }}>Cancel</button></p>}
      {!game.result && <button className="quiet-button" disabled={busy || !connected} onClick={() => setConfirm(true)}>Resign</button>}
      {!game.result && (game.drawOfferedBy ? game.drawOfferedBy === account.id ? <p role="status">Draw offered. Waiting for your opponent.</p> : <div role="group" aria-label="Opponent draw offer"><p>Your opponent offers a draw.</p><button className="primary-button" disabled={busy || !connected} onClick={() => action(async () => accept(await gameApi.respondToDraw(id, true)))}>Accept draw</button><button className="quiet-button" disabled={busy || !connected} onClick={() => action(async () => accept(await gameApi.respondToDraw(id, false)))}>Decline draw</button></div> : <button className="quiet-button" disabled={busy || !connected} onClick={() => action(async () => accept(await gameApi.offerDraw(id)))}>Offer draw</button>)}
      <MoveLedger history={history} activePly={reviewing ? displayed.ply : null} onSelect={selectPly} />
      <div className="replay-controls" aria-label="Game review">
        <button onClick={() => selectPly(0)} disabled={!displayed.ply}>First</button>
        <button onClick={() => selectPly(displayed.ply - 1)} disabled={!displayed.ply}>Previous</button>
        <span>{displayed.ply} / {history.length}</span>
        <button onClick={() => selectPly(displayed.ply + 1)} disabled={displayed.ply === history.length}>Next</button>
        <button onClick={() => setReview(null)} disabled={!reviewing}>{game.result ? 'Final position' : 'Live position'}</button>
      </div>
      <details className="position-tools"><summary>Position & game files</summary>
        <p>PGN contains the full game record. FEN contains the displayed position.</p>
        <button className="quiet-button" onClick={() => exportGame('pgn')}>Export PGN</button>
        <button className="quiet-button" onClick={() => exportGame('fen')}>Export FEN</button>
      </details>
      {!game.result && <details><summary>Claim a rule-based draw</summary><p>Claim threefold repetition or the fifty-move rule in this position, or announce the move that would meet the rule. An announced move is not played.</p><label htmlFor="claim-move">Position to check</label><select id="claim-move" value={intendedMove} disabled={!myTurn || busy} onChange={(event) => setIntendedMove(event.target.value)}><option value="">Current position</option>{claimMoves.map((move) => <option key={move.lan} value={`${move.from}${move.to}${move.promotion || ''}`}>After {move.san}</option>)}</select><button className="quiet-button" disabled={busy || !connected || !myTurn} onClick={() => action(async () => accept(await gameApi.claimDraw(id, game.moves.length, intendedMove)))}>Submit draw claim</button></details>}
      {game.result && <div aria-label="Rematch controls">
        {rematch?.requestedBy === account.id ? <p role="status">Rematch requested. Waiting for your opponent.</p> : <button className="primary-button" disabled={busy || !connected} onClick={() => action(() => rematchAction())}>{rematch?.requestedBy ? 'Accept rematch' : 'Request rematch'}</button>}
        {rematch?.requestedBy && <button className="quiet-button" disabled={busy || !connected} onClick={() => action(() => rematchAction(true))}>{rematch.requestedBy === account.id ? 'Cancel rematch request' : 'Decline rematch'}</button>}
      </div>}
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
