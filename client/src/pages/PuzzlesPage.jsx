import { useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { ChessBoard } from '../components/ChessBoard'
import { MoveLedger } from '../components/MoveLedger'
import { useSession } from '../context/SessionContext'
import { puzzles } from '../data/puzzles'
import { getPuzzleProgress, markPuzzleComplete } from '../lib/storage'
import { isPuzzleAnswer } from '../lib/puzzleAnswer'
import { loadPuzzleStats, savePuzzleStats, updatePuzzleStats } from '../lib/puzzleStats'

export function PuzzlesPage() {
  const { session } = useSession()
  return <PuzzleStudy key={session?.id || 'guest'} ownerId={session?.id || 'guest'} />
}

function PuzzleStudy({ ownerId }) {
  const [selectedId, setSelectedId] = useState(puzzles[0].id)
  const [fen, setFen] = useState(puzzles[0].fen)
  const [step, setStep] = useState(0)
  const [history, setHistory] = useState([])
  const [feedback, setFeedback] = useState('Find the forcing line.')
  const [hint, setHint] = useState(false)
  const [completed, setCompleted] = useState(() => getPuzzleProgress(ownerId))
  const [revealed, setRevealed] = useState(false)
  const [stats, setStats] = useState(() => loadPuzzleStats(ownerId))
  const statsRef = useRef(stats)
  const attempt = useRef(null)
  function record(event) {
    attempt.current ||= crypto.randomUUID()
    const updated = updatePuzzleStats(statsRef.current, attempt.current, event)
    statsRef.current = updated
    setStats(updated)
    savePuzzleStats(ownerId, updated)
  }
  const puzzle = puzzles.find((item) => item.id === selectedId) || puzzles[0]
  const game = new Chess(fen)
  const solved = step >= puzzle.solution.length
  const lastMove = history.at(-1)

  useEffect(() => {
    attempt.current = null
    setFen(puzzle.fen)
    setStep(0)
    setHistory([])
    setHint(false)
    setRevealed(false)
    setFeedback('Find the forcing line.')
  }, [puzzle])

  function choosePuzzle(id) {
    setSelectedId(id)
  }

  function resetPuzzle() {
    attempt.current = null
    setFen(puzzle.fen)
    setStep(0)
    setHistory([])
    setHint(false)
    setRevealed(false)
    setFeedback('The position has been set again.')
  }

  function playMove(move) {
    if (solved || revealed || game.turn() !== puzzle.side) return false
    const next = new Chess(fen)
    try {
      const played = next.move(move)
      record('start')
      if (!isPuzzleAnswer(puzzle, step, played, next)) {
        record('mistake')
        setFeedback('Not the intended move. Try another candidate.')
        return false
      }

      let nextStep = step + 1
      while (nextStep < puzzle.solution.length && next.turn() !== puzzle.side) {
        next.move(puzzle.solution[nextStep])
        nextStep += 1
      }

      const lineFinished = nextStep >= puzzle.solution.length
      setFen(next.fen())
      setHistory((previous) => [...previous, ...next.history({ verbose: true })])
      setStep(nextStep)
      setHint(false)
      if (lineFinished) {
        record('solve')
        const progress = markPuzzleComplete(ownerId, puzzle.id)
        setCompleted(progress)
        setFeedback('Well found. This study is now marked in your scorebook.')
      } else {
        setFeedback('Correct. Continue the line.')
      }
      return true
    } catch {
      setFeedback('That move is not legal from this position.')
      return false
    }
  }

  const hintText = puzzle.solution[step]?.includes('+') ? 'Look for a check that narrows the reply.' : 'Look for a forcing move before counting material.'

  function showSolution() {
    const solution = new Chess(puzzle.fen)
    for (const move of puzzle.solution) solution.move(move)
    record('reveal')
    setFen(solution.fen())
    setHistory(solution.history({ verbose: true }))
    setStep(puzzle.solution.length)
    setHint(false)
    setRevealed(true)
    setFeedback('Solution shown. Retry the puzzle to solve it yourself; revealing it does not mark it complete.')
  }

  return (
    <section className="puzzle-page">
      <header className="page-heading"><p className="eyebrow">Study room</p><h1>Puzzles</h1><p>Small, composed positions to keep the board sharp.</p></header>
      <section aria-label="Puzzle progress">
        <p>{stats.attempted} attempted · {stats.solved} solved · {stats.attempted ? Math.round(stats.unassisted / stats.attempted * 100) : 0}% unassisted success · Streak {stats.streak} · Best {stats.best}</p>
        <p className="small-note">Attempts start with a move, hint or solution reveal. Mistakes and hints break the unassisted streak. Retries count as new attempts; older completion marks are not included in these statistics.</p>
      </section>
      <div className="puzzle-layout">
        <aside className="puzzle-index" aria-label="Puzzle list">
          <p className="eyebrow">{puzzles.length} studies</p>
          {puzzles.map((item, index) => (
            <button key={item.id} type="button" className={item.id === puzzle.id ? 'current' : ''} onClick={() => choosePuzzle(item.id)}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <b>{item.title}</b>
              {completed.includes(item.id) && <i aria-label="Completed">✓</i>}
            </button>
          ))}
        </aside>
        <div className="puzzle-table">
          <div className="puzzle-title"><div><span>{puzzle.theme}</span><h2>{puzzle.title}</h2></div><p>{puzzle.side === 'w' ? 'White' : 'Black'} to play</p></div>
          <ChessBoard fen={fen} onMove={playMove} interactive={!solved && !revealed} flipped={puzzle.side === 'b'} lastMove={lastMove} label={`${puzzle.title} puzzle board`} />
          <div className="puzzle-controls">
            <button className="primary-button" type="button" disabled={solved || revealed} onClick={() => { if (!hint) record('hint'); setHint(!hint) }}>{hint ? 'Hide hint' : 'Reveal hint'}</button>
            <button className="quiet-button" type="button" disabled={solved || revealed} onClick={showSolution}>Show solution</button>
            <button className="quiet-button" type="button" onClick={resetPuzzle}>Retry puzzle</button>
            <button className="quiet-button" type="button" onClick={() => choosePuzzle(puzzles[(puzzles.findIndex((item) => item.id === puzzle.id) + 1) % puzzles.length].id)}>Next puzzle</button>
          </div>
          <p className="study-note" role="status">{hint ? hintText : feedback}</p>
          <p className="small-note">{ownerId === 'guest' ? 'Guest progress is saved in this browser.' : 'Progress is currently saved in this browser for your account.'}</p>
        </div>
        <aside className="puzzle-ledger"><p className="eyebrow">Analysis</p><p>{puzzle.note}</p><MoveLedger history={history} /></aside>
      </div>
    </section>
  )
}
