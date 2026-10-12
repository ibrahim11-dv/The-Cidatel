// This is only a display estimate. Only a server result ends an online game.
export function onlineClockMillis(clocks, side, receivedAt, now, finished = false) {
  const elapsed = !finished && clocks.running === side.toUpperCase()
    ? Math.max(0, now - receivedAt) : 0
  return Math.max(0, clocks[`${side}Millis`] - elapsed)
}
