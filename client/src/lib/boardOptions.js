export const DEFAULT_BOARD_OPTIONS = { coordinates: true, legalMoves: true, sound: false, animationMs: 160, orientation: 'white' }
const KEY = 'citadel:board-options'

export function normalizeBoardOptions(value = {}) {
  return {
    coordinates: typeof value.coordinates === 'boolean' ? value.coordinates : true,
    legalMoves: typeof value.legalMoves === 'boolean' ? value.legalMoves : true,
    sound: typeof value.sound === 'boolean' ? value.sound : false,
    animationMs: [0, 100, 160, 240].includes(value.animationMs) ? value.animationMs : 160,
    orientation: value.orientation === 'black' ? 'black' : 'white',
  }
}
export function readBoardOptions() {
  try { return normalizeBoardOptions(JSON.parse(localStorage.getItem(KEY)) || {}) } catch { return { ...DEFAULT_BOARD_OPTIONS } }
}
export function saveBoardOptions(options) {
  try { localStorage.setItem(KEY, JSON.stringify(normalizeBoardOptions(options))); return true } catch { return false }
}
