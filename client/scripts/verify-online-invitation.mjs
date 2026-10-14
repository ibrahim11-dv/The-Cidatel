import assert from 'node:assert/strict'
import { invitationCodeFromSearch, shouldAutoJoinInvitation } from '../src/lib/onlineInvitation.js'

assert.equal(invitationCodeFromSearch('?invite=  invitation-42  '), 'invitation-42')
assert.equal(invitationCodeFromSearch('?time=5%2B3'), '')
assert.equal(invitationCodeFromSearch(''), '')

const ready = { checkingActive: false, code: 'invitation-42', gameId: '', invitation: null, searching: false, attempted: false }
assert.equal(shouldAutoJoinInvitation(ready), true)
for (const override of [
  { checkingActive: true }, { gameId: 'active-game' }, { invitation: { code: 'hosted-room' } },
  { searching: true }, { attempted: true }, { code: '' },
]) {
  assert.equal(shouldAutoJoinInvitation({ ...ready, ...override }), false)
}

console.log('Invitation links join only after the active-game check and never replace an active table, hosted room, or matchmaking search.')
