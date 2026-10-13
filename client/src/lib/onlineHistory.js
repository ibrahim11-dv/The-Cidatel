export function onlineResultStats(games, accountId) {
  return games.reduce((summary, game) => {
    const score = game.result?.score
    if (score === '1/2-1/2') summary.draws++
    else if ((game.white === accountId && score === '1-0') || (game.black === accountId && score === '0-1')) summary.wins++
    return summary
  }, { wins: 0, draws: 0 })
}
