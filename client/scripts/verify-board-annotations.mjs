import assert from 'node:assert/strict'
import { boardArrows } from '../src/lib/boardAnnotations.js'

assert.deepEqual(boardArrows([{ from: 'a1', to: 'h8' }]), [{ from: 'a1', to: 'h8', x: 6.25, y: 93.75, x2: 93.75, y2: 6.25 }])
assert.deepEqual(boardArrows([{ from: 'a1', to: 'h8' }], true), [{ from: 'a1', to: 'h8', x: 93.75, y: 6.25, x2: 6.25, y2: 93.75 }])
assert.deepEqual(boardArrows([{ from: 'e2', to: 'e4' }, { from: 'z9', to: 'a1' }, { from: 'a1', to: 'a1' }]).map(({ from, to }) => ({ from, to })), [{ from: 'e2', to: 'e4' }])
console.log('Board annotation arrows follow board orientation and reject invalid square pairs.')
