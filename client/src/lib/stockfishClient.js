import { Chess } from 'chess.js'
import { assertPlayablePosition } from './chess.js'

export const ENGINE_PATH = '/stockfish/stockfish-19-lite-single.js'

// Own one UCI stream. A canceled search must emit its final bestmove before
// another search starts, since the protocol has no per-search response IDs.
export class StockfishClient {
  constructor({ createWorker = () => new Worker(ENGINE_PATH), onState = () => {}, timeoutMs = 15000 } = {}) {
    this.onState = onState
    this.timeoutMs = timeoutMs
    this.state = 'loading'
    this.active = null
    this.queued = null
    this.searching = false
    this.onState('loading', '')
    try {
      this.worker = createWorker()
      this.worker.onmessage = ({ data }) => this.receive(String(data).trim())
      this.worker.onerror = () => this.fail('Stockfish stopped unexpectedly. Restart the engine to continue.')
      this.worker.onmessageerror = () => this.fail('Stockfish returned unreadable data. Restart the engine to continue.')
      this.armTimeout('Stockfish took too long to start. Restart the engine to try again.')
      this.worker.postMessage('uci')
    } catch { this.fail('Stockfish could not start in this browser.') }
  }

  armTimeout(message) {
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.fail(message), this.timeoutMs)
  }

  receive(line) {
    if (this.state === 'error' || this.state === 'stopped') return
    if (line.includes('CRITICAL ERROR')) { this.fail('Stockfish could not evaluate this position. Restart the engine to continue.'); return }
    if (line === 'uciok' && this.state === 'loading') { this.worker.postMessage('isready'); return }
    if (line === 'readyok' && this.state === 'loading') {
      clearTimeout(this.timer)
      this.state = 'ready'
      this.onState('ready', '')
      return
    }
    if (!line.startsWith('bestmove') || !this.searching) return
    clearTimeout(this.timer)
    this.searching = false
    const request = this.active
    this.active = null
    if (request) {
      const match = line.match(/^bestmove\s+([a-h][1-8])([a-h][1-8])([qrbn])?(?:\s|$)/)
      const move = match ? { from: match[1], to: match[2], ...(match[3] ? { promotion: match[3] } : {}) } : null
      try {
        if (!move || !request.position.move(move)) throw new Error('Invalid engine response')
        request.resolve(move)
      } catch {
        request.reject(new Error('Stockfish returned an invalid move. Restart the engine to continue.'))
        this.fail('Stockfish returned an invalid move. Restart the engine to continue.')
        return
      }
    }
    const queued = this.queued
    this.queued = null
    if (queued) this.start(queued)
  }

  request(position, level) {
    if (this.state !== 'ready') return Promise.reject(new Error('Stockfish is not ready.'))
    let game, command
    try {
      game = new Chess(typeof position === 'string' ? position : position.initialFen)
      assertPlayablePosition(game)
      const initial = game.fen()
      const moves = []
      for (const move of (typeof position === 'string' ? [] : position.moves || [])) {
        const played = game.move(move)
        moves.push(`${played.from}${played.to}${played.promotion || ''}`)
      }
      command = `position fen ${initial}${moves.length ? ` moves ${moves.join(' ')}` : ''}`
      if (!game.moves().length) return Promise.resolve(null)
      if (!Number.isInteger(level.skill) || level.skill < 0 || level.skill > 20 || !Number.isFinite(level.moveTime) || level.moveTime < 1 || level.moveTime > 5000) throw new Error('Invalid engine level')
    } catch (error) { return Promise.reject(error) }
    this.cancel()
    if (this.state !== 'ready') return Promise.reject(new Error('Stockfish stopped while cancelling its search. Restart the engine to continue.'))
    return new Promise((resolve, reject) => {
      const request = { position: game, command, level, resolve, reject }
      if (this.searching) this.queued = request
      else this.start(request)
    })
  }

  start(request) {
    this.active = request
    this.searching = true
    this.armTimeout('Stockfish did not finish its search. Restart the engine to continue.')
    try {
      this.worker.postMessage('setoption name UCI_LimitStrength value false')
      this.worker.postMessage(`setoption name Skill Level value ${request.level.skill}`)
      this.worker.postMessage(request.command)
      this.worker.postMessage(`go movetime ${request.level.moveTime}`)
    } catch { this.fail('Stockfish could not receive this position. Restart the engine to continue.') }
  }

  cancel() {
    this.active?.resolve(null)
    this.queued?.resolve(null)
    this.active = null
    this.queued = null
    if (this.searching) {
      try { this.worker.postMessage('stop') } catch { this.fail('Stockfish stopped unexpectedly.') }
    }
  }

  fail(message) {
    if (this.state === 'stopped' || this.state === 'error') return
    clearTimeout(this.timer)
    this.state = 'error'
    this.active?.reject(new Error(message))
    this.queued?.reject(new Error(message))
    this.active = this.queued = null
    this.searching = false
    this.worker?.terminate()
    this.onState('error', message)
  }

  dispose() {
    clearTimeout(this.timer)
    this.state = 'stopped'
    this.active?.resolve(null)
    this.queued?.resolve(null)
    this.active = this.queued = null
    this.searching = false
    this.worker?.terminate()
  }
}
