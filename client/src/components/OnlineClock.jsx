import { useEffect, useState } from 'react'
import { onlineClockMillis } from '../lib/onlineClock'

export function OnlineClock({ clocks, side, receivedAt, finished }) {
  const [now, setNow] = useState(() => performance.now())
  const running = !finished && clocks.running === side.toUpperCase()
  useEffect(() => {
    setNow(performance.now())
    if (!running) return
    const timer = setInterval(() => setNow(performance.now()), 100)
    return () => clearInterval(timer)
  }, [running, receivedAt])
  const seconds = Math.ceil(onlineClockMillis(clocks, side, receivedAt, now, finished) / 1000)
  return <strong aria-label={`${side} clock`} className={`chess-clock ${running ? 'running' : ''}`}>
    {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
  </strong>
}
