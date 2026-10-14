function recordTime(value) {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function onlineResult(game, accountId) {
  const score = game.result?.score
  const outcome = score === '1/2-1/2' ? 'Draw'
    : (game.white === accountId && score === '1-0') || (game.black === accountId && score === '0-1') ? 'Won'
      : 'Lost'
  return game.result?.reason ? `${outcome} · ${game.result.reason}` : outcome
}

export function scorebookRecords(localGames, onlineGames, accountId) {
  const local = localGames.map((game) => ({
    id: `local:${game.id}`,
    href: `/history/${game.id}`,
    date: game.createdAt,
    title: game.mode === 'bot' ? 'House bot' : 'Local game',
    result: game.result,
    ply: game.moves.length,
  }))
  const online = onlineGames.map((game) => ({
    id: `online:${game.id}`,
    href: `/online?game=${game.id}`,
    date: new Date(game.savedAtMillis).toISOString(),
    title: 'Online game',
    result: onlineResult(game, accountId),
    ply: game.moves.length,
  }))
  return [...local, ...online].sort((left, right) => recordTime(right.date) - recordTime(left.date))
}

export function visibleScorebookRecords(records, expanded, limit = 7) {
  return expanded ? records : records.slice(0, limit)
}
