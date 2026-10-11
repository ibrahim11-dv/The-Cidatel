import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { StockfishClient } from '../src/lib/stockfishClient.js'
const level = { skill: 5, moveTime: 50 }
class WorkerDouble {
  commands = []
  postMessage(command) { this.commands.push(command) }
  emit(data) { this.onmessage({ data }) }
  terminate() { this.stopped = true }
}
function create(timeoutMs = 15000) {
  const worker = new WorkerDouble()
  const states = []
  const client = new StockfishClient({ createWorker: () => worker, timeoutMs, onState: (state) => states.push(state) })
  return { worker, client, states }
}
const { worker, client } = create()
worker.emit('uciok'); worker.emit('readyok')
const first = client.request(new Chess().fen(), level)
client.cancel()
const second = client.request(new Chess().fen(), level)
assert.equal(worker.commands.filter((command) => command.startsWith('go ')).length, 1)
worker.emit('bestmove e2e4')
assert.equal(await first, null)
assert.equal(worker.commands.filter((command) => command.startsWith('go ')).length, 2)
worker.emit('bestmove d2d4')
assert.deepEqual(await second, { from: 'd2', to: 'd4' })
const invalid = client.request(new Chess().fen(), level)
const invalidCheck = assert.rejects(invalid, /invalid move/)
worker.emit('bestmove e2e5')
await invalidCheck
assert.equal(client.state, 'error')
assert.equal(worker.stopped, true)
client.dispose()
const slow = create(20)
await new Promise((resolve) => setTimeout(resolve, 35))
assert.equal(slow.client.state, 'error')
assert.equal(slow.worker.stopped, true)
slow.client.dispose()
const drain = create(20)
drain.worker.emit('uciok'); drain.worker.emit('readyok')
const old = drain.client.request(new Chess().fen(), level)
drain.client.cancel()
const queued = drain.client.request(new Chess().fen(), level)
const queuedCheck = assert.rejects(queued, /did not finish/)
assert.equal(await old, null)
await queuedCheck
assert.equal(drain.client.state, 'error')
drain.client.dispose()
const disposed = create()
disposed.worker.emit('uciok'); disposed.worker.emit('readyok')
const pending = disposed.client.request(new Chess().fen(), level)
disposed.client.dispose()
assert.equal(await pending, null)
disposed.worker.emit('bestmove e2e4')
assert.equal(disposed.client.state, 'stopped')
const brokenStop = create()
brokenStop.worker.emit('uciok'); brokenStop.worker.emit('readyok')
const interrupted = brokenStop.client.request(new Chess().fen(), level)
const originalPost = brokenStop.worker.postMessage.bind(brokenStop.worker)
brokenStop.worker.postMessage = (command) => {
  if (command === 'stop') throw new Error('Worker unavailable')
  originalPost(command)
}
await assert.rejects(brokenStop.client.request(new Chess().fen(), level), /stopped while cancelling/)
assert.equal(await interrupted, null)
assert.equal(brokenStop.client.state, 'error')
assert.equal(brokenStop.client.active, null)
assert.equal(brokenStop.worker.commands.filter((command) => command.startsWith('go ')).length, 1)
brokenStop.client.dispose()
console.log('Passed UCI cancellation isolation, failed-stop recovery, invalid reply rejection, boot/search watchdogs and disposal checks.')
