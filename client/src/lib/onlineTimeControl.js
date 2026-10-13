export const ONLINE_TIME_LIMITS = { minSeconds: 15, maxSeconds: 10_800, minIncrement: 0, maxIncrement: 180 }

function wholeNumber(value) {
  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

export function validateOnlineTimeControl(seconds, increment) {
  const initial = wholeNumber(seconds)
  const bonus = wholeNumber(increment)
  if (initial == null || bonus == null || initial < ONLINE_TIME_LIMITS.minSeconds || initial > ONLINE_TIME_LIMITS.maxSeconds ||
      bonus < ONLINE_TIME_LIMITS.minIncrement || bonus > ONLINE_TIME_LIMITS.maxIncrement) return null
  return { seconds: initial, increment: bonus }
}

export function presetOnlineTimeControl(value) {
  const match = /^(\d+)\+(\d+)$/.exec(value || '')
  return match ? validateOnlineTimeControl(Number(match[1]) * 60, match[2]) : null
}

export function selectedOnlineTimeControl(selection, customSeconds, customIncrement) {
  return selection === 'custom'
    ? validateOnlineTimeControl(customSeconds, customIncrement)
    : presetOnlineTimeControl(selection)
}

export function formatOnlineTimeControl({ seconds, increment }) {
  const initial = seconds % 60 === 0 ? String(seconds / 60) : `${seconds}s`
  return `${initial} + ${increment}`
}

export function selectionForOnlineTimeControl(seconds, increment, presets) {
  const preset = presets.find(([value]) => {
    const setup = presetOnlineTimeControl(value)
    return setup?.seconds === seconds && setup.increment === increment
  })
  return preset ? { selection: preset[0], customSeconds: String(seconds), customIncrement: String(increment) }
    : { selection: 'custom', customSeconds: String(seconds), customIncrement: String(increment) }
}
