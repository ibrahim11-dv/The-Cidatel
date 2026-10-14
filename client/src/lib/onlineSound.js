import { moveSound } from './sound.js'

function resultKey(result) {
  return result ? `${result.score}:${result.reason}` : ''
}

export function onlineSoundEvent(previous, game, history) {
  if (!game) return { snapshot: null, sound: null }
  const snapshot = { id: game.id, moves: history.length, result: resultKey(game.result) }
  if (!previous || previous.id !== snapshot.id) return { snapshot, sound: null }
  if (history.length > previous.moves) return { snapshot, sound: game.result ? 'end' : moveSound(history.at(-1)) }
  if (!previous.result && snapshot.result) return { snapshot, sound: 'end' }
  return { snapshot, sound: null }
}
