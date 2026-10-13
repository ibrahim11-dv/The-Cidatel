import assert from 'node:assert/strict'
import { formatOnlineTimeControl, presetOnlineTimeControl, selectedOnlineTimeControl, selectionForOnlineTimeControl, validateOnlineTimeControl } from '../src/lib/onlineTimeControl.js'

const presets = [['1+0', '1 + 0'], ['5+3', '5 + 3']]
assert.deepEqual(presetOnlineTimeControl('5+3'), { seconds: 300, increment: 3 })
assert.equal(presetOnlineTimeControl('0+0'), null)
assert.deepEqual(selectedOnlineTimeControl('custom', '15', '180'), { seconds: 15, increment: 180 })
assert.equal(selectedOnlineTimeControl('custom', '14', '0'), null)
assert.equal(validateOnlineTimeControl('300.5', 0), null)
assert.equal(validateOnlineTimeControl(10_801, 0), null)
assert.deepEqual(selectionForOnlineTimeControl(300, 3, presets), { selection: '5+3', customSeconds: '300', customIncrement: '3' })
assert.deepEqual(selectionForOnlineTimeControl(45, 2, presets), { selection: 'custom', customSeconds: '45', customIncrement: '2' })
assert.equal(formatOnlineTimeControl({ seconds: 45, increment: 2 }), '45s + 2')
assert.equal(formatOnlineTimeControl({ seconds: 300, increment: 3 }), '5 + 3')
console.log('Online time controls validate server-compatible custom clocks and restore their lobby selection.')
