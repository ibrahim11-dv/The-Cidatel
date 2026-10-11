import { useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChessBoard } from '../components/ChessBoard'
import { CapturedPieces, MoveLedger } from '../components/MoveLedger'
import { useSession } from '../context/SessionContext'
import { formatDate } from '../lib/chess'
import { getGames } from '../lib/storage'

export function HistoryPage() {
  const { session } = useSession()
  const { gameId } = useParams()
  const record = getGames(session?.id || 'guest').find((game) => game.id === gameId)
  const [ply, setPly] = useState(0)
  const replay = useMemo(() => {
    const game = new Chess(record?.initialFen)
    for (let index = 0; record && index < ply; index += 1) game.move(record.moves[index])
    return game
  }, [record, ply])

  if (!record) return <Navigate to="/profile" replace />
  const history = record.moves
  const lastMove = ply ? history[ply - 1] : null

  return (
    <section className="history-page">
      <div className="page-heading history-heading"><div><p className="eyebrow">Scorebook replay</p><h1>{record.mode === 'bot' ? 'House bot game' : 'Local game'}</h1><p>{formatDate(record.createdAt)} · {record.result}</p></div><Link className="text-link" to="/profile">← Back to scorebook</Link></div>
      <div className="history-layout">
        <ChessBoard fen={replay.fen()} interactive={false} lastMove={lastMove} label="Read-only game replay" />
        <aside className="score-panel replay-panel"><p className="eyebrow">Move record</p><MoveLedger history={history} activePly={ply} onSelect={setPly} /><CapturedPieces history={history} /><div className="replay-controls"><button type="button" onClick={() => setPly(0)} disabled={!ply}>First</button><button type="button" onClick={() => setPly(Math.max(0, ply - 1))} disabled={!ply}>Previous</button><span>{ply} / {history.length}</span><button type="button" onClick={() => setPly(Math.min(history.length, ply + 1))} disabled={ply === history.length}>Next</button><button type="button" onClick={() => setPly(history.length)} disabled={ply === history.length}>Last</button></div></aside>
      </div>
    </section>
  )
}
