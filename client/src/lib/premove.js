export function premoveFen(fen, color) {
  const fields = fen.split(' ')
  if (!['w', 'b'].includes(color) || fields.length !== 6) return fen
  fields[1] = color
  return fields.join(' ')
}

export function premoveText(move) {
  return `${move.from}–${move.to}${move.promotion ? `=${move.promotion.toUpperCase()}` : ''}`
}
