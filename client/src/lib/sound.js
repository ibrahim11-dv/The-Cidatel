// Short synthesized wooden clicks: no network assets, timers or audio loop.
let context
export function unlockSound() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext
    if (!Audio) return
    context ||= new Audio()
    if (context.state === 'suspended') void context.resume().catch(() => {})
  } catch { /* Audio is optional; never interrupt a move. */ }
}
export function playSound(kind = 'move') {
  if (!context || context.state !== 'running') return
  const notes = {
    move: [280], capture: [180, 120], check: [440, 554], castle: [250, 330],
    promotion: [330, 440, 660], start: [330, 440], end: [440, 330, 220], success: [330, 440, 660],
  }[kind] || [280]
  try {
    notes.forEach((frequency, index) => {
      const start = context.currentTime + index * 0.065
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, start)
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.65, start + 0.08)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.1)
      oscillator.connect(gain).connect(context.destination)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
      oscillator.start(start)
      oscillator.stop(start + 0.11)
    })
  } catch { /* Muted/unavailable audio must not interfere with play. */ }
}
export function moveSound(move) {
  return move.san.includes('+') || move.san.includes('#') ? 'check' : move.promotion ? 'promotion' :
    move.flags.includes('k') || move.flags.includes('q') ? 'castle' : move.captured ? 'capture' : 'move'
}
