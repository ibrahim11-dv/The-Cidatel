import { useEffect, useState } from 'react'
import { Chess } from 'chess.js'
import { ChessBoard } from '../components/ChessBoard'
import { MoveLedger } from '../components/MoveLedger'
import { useSession } from '../context/SessionContext'
import { puzzles } from '../data/puzzles'
import { getPuzzleProgress, markPuzzleComplete } from '../lib/storage'

export function PuzzlesPage() {
  const { session } = useSession()
  const [selectedId, setSelectedId] = useState(puzzles[0].id)
  const [fen, setFen] = useState(puzzles[0].fen)
  const [step, setStep] = useState(0)
  const [history, setHistory] = useState([])
  const [feedback, setFeedback] = useState('Find the forcing line.')
  const [hint, setHint] = useState(false)
  const [completed, setCompleted] = useState(() => getPuzzleProgress(session.id))
  const puzzle = puzzles.find((item) => item.id === selectedId) || puzzles[0]
  const game = new Chess(fen)
  const solved = step >= puzzle.solution.length
  const lastMove = history.at(-1)

  useEffect(() => {
    setFen(puzzle.fen)
    setStep(0)
    setHistory([])
    setHint(false)
    setFeedback('Find the forcing line.')
  }, [puzzle])

  function choosePuzzle(id) {
    setSelectedId(id)
  }

  function resetPuzzle() {
    setFen(puzzle.fen)
    setStep(0)
    setHistory([])
    setHint(false)
    setFeedback('The position has been set again.')
  }

  function playMove(move) {
    if (solved || game.turn() !== puzzle.side) return false
    const next = new Chess(fen)
    try {
      const played = next.move(move)
      if (played.san !== puzzle.solution[step]) {
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
      setHistory(next.history({ verbose: true }))
      setStep(nextStep)
      setHint(false)
      if (lineFinished) {
        const progress = markPuzzleComplete(session.id, puzzle.id)
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

  return (
    <section className="puzzle-page">
      <header className="page-heading"><p className="eyebrow">Study room</p><h1>Puzzles</h1><p>Small, composed positions to keep the board sharp.</p></header>
      <div className="puzzle-layout">
        <aside className="puzzle-index" aria-label="Puzzle list">
          <p className="eyebrow">Six studies</p>
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
          <ChessBoard fen={fen} onMove={playMove} flipped={puzzle.side === 'b'} lastMove={lastMove} label={`${puzzle.title} puzzle board`} />
          <div className="puzzle-controls">
            <button className="primary-button" type="button" onClick={() => setHint(!hint)}>{hint ? 'Hide hint' : 'Reveal hint'}</button>
            <button className="quiet-button" type="button" onClick={resetPuzzle}>Reset position</button>
          </div>
          <p className="study-note">{hint ? hintText : feedback}</p>
        </div>
        <aside className="puzzle-ledger"><p className="eyebrow">Analysis</p><p>{puzzle.note}</p><MoveLedger history={history} /></aside>
      </div>
    </section>
  )
}
