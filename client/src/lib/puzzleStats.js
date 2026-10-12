export const emptyPuzzleStats = () => ({ attempted: 0, solved: 0, unassisted: 0, streak: 0, best: 0, active: null })

export function updatePuzzleStats(previous, id, event) {
  const stats = { ...previous, active: previous.active ? { ...previous.active } : null }
  if (stats.active?.id !== id) {
    if (stats.active && !stats.active.solved) stats.streak = 0
    stats.attempted++
    stats.active = { id, failed: false, solved: false, revealed: false }
  }
  if (stats.active.solved || stats.active.revealed) return stats
  if (['mistake', 'hint', 'reveal'].includes(event)) {
    stats.active.failed = true
    stats.streak = 0
    if (event === 'reveal') stats.active.revealed = true
  }
  if (event === 'solve') {
    stats.active.solved = true
    stats.solved++
    if (!stats.active.failed) {
      stats.unassisted++
      stats.streak++
      stats.best = Math.max(stats.best, stats.streak)
    }
  }
  return stats
}

export function loadPuzzleStats(ownerId) {
  try {
    const value = JSON.parse(window.localStorage.getItem(`citadel:puzzle-stats:${ownerId}`))
    if (value && ['attempted', 'solved', 'unassisted', 'streak', 'best'].every((key) => Number.isSafeInteger(value[key]) && value[key] >= 0)
      && (!value.active || (typeof value.active.id === 'string' && ['failed', 'solved', 'revealed'].every((key) => typeof value.active[key] === 'boolean')))) return value
  } catch { /* Continue playing when storage is unavailable or invalid. */ }
  return emptyPuzzleStats()
}

export function savePuzzleStats(ownerId, stats) {
  try { window.localStorage.setItem(`citadel:puzzle-stats:${ownerId}`, JSON.stringify(stats)) }
  catch { /* Keep in-memory progress when storage is unavailable. */ }
}
