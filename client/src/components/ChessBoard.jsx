import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { useSession } from '../context/SessionContext'
import { ChessPiece } from './ChessPiece'
import { premoveFen } from '../lib/premove'
import { boardArrows } from '../lib/boardAnnotations'

const PIECES = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
}

const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }

export function pieceGlyph(piece) {
  return piece ? PIECES[piece.color][piece.type] : ''
}

export function ChessBoard({ fen, onMove, flipped = false, interactive = true, lastMove = null, label = 'Chessboard', premoveColor = null, markedSquares = [], arrows = [] }) {
  const { preferences, boardOptions } = useSession()
  const boardRef = useRef(null)
  const previousFen = useRef(fen)
  const [selected, setSelected] = useState(null)
  const [focusedSquare, setFocusedSquare] = useState(flipped ? 'h8' : 'a1')
  const [promotion, setPromotion] = useState(null)
  const drag = useRef(null)
  const suppressClick = useRef(false)
  const markerId = `citadel-arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const game = useMemo(() => new Chess(fen), [fen])
  const inputGame = useMemo(() => premoveColor && game.turn() !== premoveColor ? new Chess(premoveFen(fen, premoveColor)) : game, [fen, game, premoveColor])
  const files = flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]
  const options = selected ? inputGame.moves({ square: selected, verbose: true }) : []
  const targets = new Set(options.map((move) => move.to))
  const marked = useMemo(() => new Set(markedSquares), [markedSquares])
  const annotationArrows = useMemo(() => boardArrows(arrows, flipped), [arrows, flipped])

  useLayoutEffect(() => {
    const before = previousFen.current
    previousFen.current = fen
    if (!lastMove || lastMove.before !== before || lastMove.after !== fen || before === fen ||
        !boardOptions.animationMs || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animations = []
    const ghosts = []
    const squareNode = (square) => boardRef.current?.querySelector(`[data-square="${square}"]`)
    function slide(from, to) {
      const origin = squareNode(from)?.getBoundingClientRect()
      const destination = squareNode(to)
      const bounds = destination?.getBoundingClientRect()
      const piece = destination?.querySelector('.piece')
      if (!origin || !bounds || !piece) return
      animations.push(piece.animate([
        { transform: `translate(${origin.x - bounds.x}px, ${origin.y - bounds.y}px)` },
        { transform: 'translate(0, 0)' },
      ], { duration: boardOptions.animationMs, easing: 'cubic-bezier(.2,.7,.3,1)' }))
    }
    slide(lastMove.from, lastMove.to)
    if (lastMove.flags.includes('k')) slide(`h${lastMove.to[1]}`, `f${lastMove.to[1]}`)
    if (lastMove.flags.includes('q')) slide(`a${lastMove.to[1]}`, `d${lastMove.to[1]}`)
    if (lastMove.captured) {
      const square = lastMove.flags.includes('e') ? `${lastMove.to[0]}${lastMove.from[1]}` : lastMove.to
      const node = squareNode(square)
      if (node) {
        const ghost = document.createElement('span')
        ghost.className = `capture-ghost ${lastMove.color === 'w' ? 'black-piece' : 'white-piece'}`
        ghost.setAttribute('aria-hidden', 'true')
        ghost.textContent = PIECES[lastMove.color === 'w' ? 'b' : 'w'][lastMove.captured]
        node.appendChild(ghost)
        ghosts.push(ghost)
        animations.push(ghost.animate([{ opacity: 0.7, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.65)' }], { duration: boardOptions.animationMs, fill: 'forwards' }))
      }
    }
    return () => { animations.forEach((animation) => animation.cancel()); ghosts.forEach((ghost) => ghost.remove()) }
  }, [fen, lastMove?.before, lastMove?.after, boardOptions.animationMs])

  useEffect(() => {
    setSelected(null)
    setPromotion(null)
  }, [fen])

  useEffect(() => {
    setFocusedSquare(flipped ? 'h8' : 'a1')
  }, [flipped])

  function commit(move) {
    const changed = onMove?.({ from: move.from, to: move.to, promotion: move.promotion })
    if (changed !== false) { setSelected(null); setPromotion(null) }
  }

  function chooseSquare(square) {
    if (!interactive || promotion || game.isCheckmate() || game.isStalemate() || game.isInsufficientMaterial()) return
    const piece = game.get(square)
    const candidates = options.filter((move) => move.to === square)

    if (candidates.length) {
      if (candidates.some((move) => move.promotion)) {
        setPromotion({ from: selected, to: square })
      } else {
        commit(candidates[0])
      }
      return
    }

    if (piece?.color === inputGame.turn()) setSelected(square)
    else setSelected(null)
  }

  function moveFocus(event, file, rank) {
    const directions = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    }
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault()
    const column = files.indexOf(file) + direction[0]
    const row = ranks.indexOf(rank) + direction[1]
    const next = files[column] && ranks[row] && `${files[column]}${ranks[row]}`
    if (next) {
      setFocusedSquare(next)
      boardRef.current?.querySelector(`[data-square="${next}"]`)?.focus()
    }
  }

  return (
    <div className={`board-wrap board-theme-${preferences.boardTheme} piece-style-${preferences.pieceStyle} piece-tone-${preferences.pieceTone}`}>
      <div className="board-frame">
        <div ref={boardRef} className="chess-board" role="grid" aria-label={label}>
          {ranks.map((rank, rowIndex) => files.map((file, columnIndex) => {
            const square = `${file}${rank}`
            const piece = game.get(square)
            const isDark = (rank + file.charCodeAt(0)) % 2 === 0
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square)
            const isTarget = boardOptions.legalMoves && targets.has(square)
            const isMarked = marked.has(square)
            const description = piece ? `${piece.color === 'w' ? 'White' : 'Black'} ${NAMES[piece.type]} on ${square}` : `Empty ${square}`
            return (
              <button
                type="button"
                key={square}
                role="gridcell"
                data-square={square}
                className={`square ${isDark ? 'dark' : 'light'} ${selected === square ? 'selected' : ''} ${isLastMove ? 'last-move' : ''} ${isTarget ? 'target' : ''} ${isMarked ? 'queued-move' : ''} ${piece?.type === 'k' && piece.color === game.turn() && game.isCheck() ? 'in-check' : ''}`}
                onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } chooseSquare(square) }}
                onKeyDown={(event) => moveFocus(event, file, rank)}
                onFocus={() => setFocusedSquare(square)}
                onPointerDown={(event) => {
                  if (!interactive || promotion || piece?.color !== inputGame.turn() || event.button !== 0) return
                  drag.current = { square, x: event.clientX, y: event.clientY }
                  event.currentTarget.setPointerCapture(event.pointerId)
                }}
                onPointerUp={(event) => {
                  const start = drag.current
                  drag.current = null
                  if (!start || !interactive || Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) return
                  suppressClick.current = true
                  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-square]')
                  if (!target || !event.currentTarget.parentElement.contains(target)) return
                  const candidates = inputGame.moves({ square: start.square, verbose: true }).filter((move) => move.to === target.dataset.square)
                  if (!candidates.length) return
                  if (candidates.some((move) => move.promotion)) setPromotion({ from: start.square, to: target.dataset.square })
                  else commit(candidates[0])
                }}
                onPointerCancel={() => { drag.current = null }}
                aria-label={description}
                aria-pressed={selected === square}
                tabIndex={interactive && focusedSquare === square ? 0 : -1}
              >
                {boardOptions.coordinates && columnIndex === 0 && <span className="rank-mark">{rank}</span>}
                {boardOptions.coordinates && rowIndex === 7 && <span className="file-mark">{file}</span>}
                {piece && <span className={`piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}><ChessPiece type={piece.type} /></span>}
              </button>
            )
          }))}
          {annotationArrows.length > 0 && <svg className="board-arrows" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
            {annotationArrows.map((arrow) => <line key={`${arrow.from}-${arrow.to}`} className="board-arrow" x1={arrow.x} y1={arrow.y} x2={arrow.x2} y2={arrow.y2} markerEnd={`url(#${markerId})`} />)}
          </svg>}
        </div>
      </div>

      {promotion && (
        <div className="promotion-popover" role="dialog" aria-modal="true" aria-label="Choose a piece for promotion" onKeyDown={(event) => {
          if (event.key === 'Escape') setPromotion(null)
          if (event.key === 'Tab') {
            const buttons = [...event.currentTarget.querySelectorAll('button')]
            const index = buttons.indexOf(document.activeElement)
            event.preventDefault()
            buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length].focus()
          }
        }}>
          <p>Promote pawn to</p>
          <div>
            {['q', 'r', 'b', 'n'].map((type) => (
              <button autoFocus={type === 'q'} key={type} type="button" onClick={() => commit({ ...promotion, promotion: type })} aria-label={`Promote to ${NAMES[type]}`}>
                {PIECES[inputGame.turn()][type]}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPromotion(null)} aria-label="Cancel promotion">×</button>
        </div>
      )}
    </div>
  )
}
