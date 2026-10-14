import { useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { ChessBoard } from '../components/ChessBoard'
import { MoveLedger } from '../components/MoveLedger'
import { useSession } from '../context/SessionContext'
import { puzzles } from '../data/puzzles'
import { getPuzzleProgress, markPuzzleComplete, savePuzzleSnapshot } from '../lib/storage'
import { isPuzzleAnswer } from '../lib/puzzleAnswer'
import { loadPuzzleStats, savePuzzleStats, updatePuzzleStats } from '../lib/puzzleStats'
import { filterPuzzles, nextPuzzleId, nextUnfinishedPuzzle, puzzleCategories, puzzleObjective, sortPuzzlesByDifficulty } from '../lib/puzzleCatalog'
import { puzzleApi } from '../lib/api'
import { moveSound, playSound, unlockSound } from '../lib/sound'

export function PuzzlesPage() {
  const { session, boardOptions } = useSession()
  return <PuzzleStudy key={session?.id || 'guest'} ownerId={session?.id || 'guest'} soundEnabled={boardOptions.sound} />
}

function PuzzleStudy({ ownerId, soundEnabled }) {
  const [selectedId, setSelectedId] = useState(puzzles[0].id)
  const [fen, setFen] = useState(puzzles[0].fen)
  const [step, setStep] = useState(0)
  const [history, setHistory] = useState([])
  const [feedback, setFeedback] = useState('Find the forcing line.')
  const [hint, setHint] = useState(false)
  const [manuallyFlipped, setManuallyFlipped] = useState(false)
  const [completed, setCompleted] = useState(() => getPuzzleProgress(ownerId))
  const [revealed, setRevealed] = useState(false)
  const [stats, setStats] = useState(() => loadPuzzleStats(ownerId))
  const [category, setCategory] = useState('All studies')
  const [syncState, setSyncState] = useState(ownerId === 'guest' ? 'guest' : 'syncing')
  const statsRef = useRef(stats)
  const completedRef = useRef(completed)
  const remoteReadyRef = useRef(ownerId === 'guest')
  const syncChainRef = useRef(Promise.resolve())
  const attempt = useRef(null)

  useEffect(() => {
    attempt.current = null
    const local = { completed: getPuzzleProgress(ownerId), stats: loadPuzzleStats(ownerId) }
    completedRef.current = local.completed
    statsRef.current = local.stats
    setCompleted(local.completed)
    setStats(local.stats)
    if (ownerId === 'guest') {
      remoteReadyRef.current = true
      setSyncState('guest')
      return undefined
    }

    let active = true
    remoteReadyRef.current = false
    setSyncState('syncing')
    puzzleApi.progress()
      .then((remote) => {
        if (!active) return
        const hasServerProgress = remote.completed.length > 0 || remote.stats.attempted > 0
        const snapshot = hasServerProgress ? remote : local
        completedRef.current = snapshot.completed
        statsRef.current = snapshot.stats
        savePuzzleSnapshot(ownerId, snapshot.completed)
        savePuzzleStats(ownerId, snapshot.stats)
        setCompleted(snapshot.completed)
        setStats(snapshot.stats)
        remoteReadyRef.current = true
        setSyncState('ready')
        if (!hasServerProgress && (local.completed.length > 0 || local.stats.attempted > 0)) {
          puzzleApi.saveProgress(snapshot).catch(() => active && setSyncState('offline'))
        }
      })
      .catch(() => {
        if (!active) return
        remoteReadyRef.current = true
        setSyncState('offline')
      })
    return () => { active = false }
  }, [ownerId])

  function persist(nextStats, nextCompleted = completedRef.current) {
    const completed = savePuzzleSnapshot(ownerId, nextCompleted)
    savePuzzleStats(ownerId, nextStats)
    const snapshot = { completed, stats: nextStats }
    completedRef.current = completed
    if (ownerId === 'guest' || !remoteReadyRef.current) return snapshot
    syncChainRef.current = syncChainRef.current
      .catch(() => undefined)
      .then(() => puzzleApi.saveProgress(snapshot))
      .then(() => setSyncState('ready'))
      .catch(() => setSyncState('offline'))
    return snapshot
  }

  function record(event) {
    attempt.current ||= crypto.randomUUID()
    const updated = updatePuzzleStats(statsRef.current, attempt.current, event)
    statsRef.current = updated
    setStats(updated)
    persist(updated)
  }
  const puzzle = puzzles.find((item) => item.id === selectedId) || puzzles[0]
  const categories = puzzleCategories(puzzles)
  const visiblePuzzles = sortPuzzlesByDifficulty(filterPuzzles(puzzles, category))
  const nextChallenge = nextUnfinishedPuzzle(visiblePuzzles, completed)
  const game = new Chess(fen)
  const solved = step >= puzzle.solution.length
  const lastMove = history.at(-1)
  const flipped = (puzzle.side === 'b') !== manuallyFlipped

  useEffect(() => {
    attempt.current = null
    setFen(puzzle.fen)
    setStep(0)
    setHistory([])
    setHint(false)
    setManuallyFlipped(false)
    setRevealed(false)
    setFeedback('Find the forcing line.')
  }, [puzzle])

  useEffect(() => {
    if (!visiblePuzzles.some((item) => item.id === selectedId)) setSelectedId(visiblePuzzles[0]?.id || puzzles[0].id)
  }, [category])

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
      if (soundEnabled) {
        unlockSound()
        playSound(lineFinished ? 'success' : moveSound(played))
      }
      setFen(next.fen())
      setHistory((previous) => [...previous, ...next.history({ verbose: true })])
      setStep(nextStep)
      setHint(false)
      if (lineFinished) {
        record('solve')
        const progress = markPuzzleComplete(ownerId, puzzle.id)
        completedRef.current = progress
        setCompleted(progress)
        persist(statsRef.current, progress)
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
          <p className="eyebrow">{visiblePuzzles.length} studies</p>
          <label className="puzzle-filter">Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          {visiblePuzzles.map((item, index) => (
            <button key={item.id} type="button" className={item.id === puzzle.id ? 'current' : ''} onClick={() => choosePuzzle(item.id)}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <b>{item.title}</b>
              {completed.includes(item.id) && <i aria-label="Completed">✓</i>}
            </button>
          ))}
        </aside>
        <div className="puzzle-table">
          <div className="puzzle-title"><div><span>{puzzle.theme}</span><h2>{puzzle.title}</h2></div><p>{puzzle.side === 'w' ? 'White' : 'Black'} to play · {puzzle.rating ? `Lichess ${puzzle.rating}` : puzzle.difficulty}</p></div>
          <ChessBoard fen={fen} onMove={playMove} interactive={!solved && !revealed && syncState !== 'syncing'} flipped={flipped} lastMove={lastMove} label={`${puzzle.title} puzzle board`} />
          <div className="puzzle-controls">
            <button className="quiet-button" type="button" aria-pressed={manuallyFlipped} onClick={() => setManuallyFlipped((value) => !value)}>Flip board</button>
            <button className="primary-button" type="button" disabled={solved || revealed || syncState === 'syncing'} onClick={() => { if (!hint) record('hint'); setHint(!hint) }}>{hint ? 'Hide hint' : 'Reveal hint'}</button>
            <button className="quiet-button" type="button" disabled={solved || revealed || syncState === 'syncing'} onClick={showSolution}>Show solution</button>
            <button className="quiet-button" type="button" onClick={resetPuzzle}>Retry puzzle</button>
            <button className="quiet-button" type="button" onClick={() => choosePuzzle(nextPuzzleId(visiblePuzzles, puzzle.id))}>Next puzzle</button>
            <button className="quiet-button" type="button" disabled={!nextChallenge} onClick={() => nextChallenge && choosePuzzle(nextChallenge.id)}>{nextChallenge ? 'Continue progression' : 'Category complete'}</button>
          </div>
          <p className="study-note" role="status">{hint ? hintText : feedback}</p>
          <p className="small-note">Objective: {puzzleObjective(puzzle)} {nextChallenge ? `Next unfinished: ${nextChallenge.title}.` : 'Every study in this category is complete.'}</p>
          <p className="small-note">{ownerId === 'guest'
            ? 'Guest progress is saved in this browser.'
            : syncState === 'syncing' ? 'Loading your account progress…'
              : syncState === 'offline' ? 'The server is unavailable. Your account progress is temporarily saved in this browser.'
                : 'Progress is saved to your account.'}</p>
        </div>
        <aside className="puzzle-ledger"><p className="eyebrow">Analysis</p><p>{puzzle.note}</p>
          <p className="small-note">Categories: {(puzzle.themes || [puzzle.theme]).join(' · ')}</p>
          {puzzle.source && <p className="small-note">Source: <a href={puzzle.source.gameUrl} target="_blank" rel="noreferrer">Lichess puzzle {puzzle.source.puzzleId}</a> · {puzzle.source.license}</p>}
          <MoveLedger history={history} /></aside>
      </div>
    </section>
  )
}
