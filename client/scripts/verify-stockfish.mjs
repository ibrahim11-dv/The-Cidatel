import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { Chess } from 'chess.js'
import { StockfishClient } from '../src/lib/stockfishClient.js'
import { BOT_LEVELS } from '../src/lib/botLevels.js'

assert.equal(BOT_LEVELS.length, 6)
assert.equal(new Set(BOT_LEVELS.map((level) => level.skill)).size, 6)
assert.deepEqual(BOT_LEVELS.map((level) => level.skill), [...BOT_LEVELS.map((level) => level.skill)].sort((a,b) => a-b))
let resolveReady, rejectReady
const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject })
const commands = []
const messages = []
let processHandle
class NodeWorker {
  constructor() {
    this.process = processHandle = spawn(process.execPath, [resolve('node_modules/stockfish/bin/stockfish-19-lite-single.js')], { stdio: ['pipe', 'pipe', 'pipe'] })
    this.lines = createInterface({ input: this.process.stdout })
    this.lines.on('line', (data) => { messages.push(data); if (messages.length > 12) messages.shift(); this.onmessage?.({data}) })
    this.process.stderr.on('data', (data) => { messages.push(data.toString()); if (messages.length > 12) messages.shift() })
    this.process.on('error', () => this.onerror?.())
    this.process.on('exit', (code) => { if (code && !this.stopped) this.onerror?.() })
  }
  postMessage(command) { commands.push(command); this.process.stdin.write(command + '\n') }
  terminate() { this.stopped = true; this.lines.close(); this.process.stdin.end('quit\n'); this.process.kill() }
}
const engine = new StockfishClient({ createWorker: () => new NodeWorker(), onState: (state, message) => { if (state === 'ready') resolveReady(); if (state === 'error') rejectReady(new Error(message)) } })
try {
  await ready
  for (const level of BOT_LEVELS) {
    const game = new Chess()
    const move = await engine.request(game.fen(), level)
    assert.ok(game.move(move), `${level.label} returns a legal move`)
    assert.ok(commands.includes(`setoption name Skill Level value ${level.skill}`))
  }
  const opening = new Chess()
  for (const san of ['e4','e5','Nf3','Nc6']) opening.move(san)
  const initialFen = opening.history({verbose:true})[0].before
  assert.ok(opening.move(await engine.request({ initialFen, moves: opening.history() }, BOT_LEVELS[2])))
  assert.ok(commands.some((command) => command.endsWith(' moves e2e4 e7e5 g1f3 b8c6')))
  const canceled = engine.request(new Chess().fen(), BOT_LEVELS[5])
  engine.cancel()
  const fresh = engine.request('7k/P7/8/8/8/8/8/7K w - - 0 1', BOT_LEVELS[5])
  assert.equal(await canceled, null)
  const promotion = await fresh
  const promoted = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1')
  assert.ok(promoted.move(promotion))
  assert.ok(promotion.promotion, 'Engine promotes the pawn')
  const mating = new Chess('6k1/8/5QK1/8/8/8/8/8 w - - 0 1')
  assert.ok(mating.move(await engine.request(mating.fen(), BOT_LEVELS[5])))
  assert.ok(mating.isCheckmate(), 'Master finishes a mate-in-one game')
  assert.equal(await engine.request(mating.fen(), BOT_LEVELS[5]), null)
  console.log('Passed live Stockfish checks: six skill levels, full-history search, cancellation/replacement, promotion, checkmate and terminal no-move handling.')
} catch (error) { console.error({ commands: commands.slice(-8), messages }); throw error }
finally { engine.dispose() }
