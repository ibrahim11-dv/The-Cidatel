export function premoveFen(fen, color) {
  const fields = fen.split(' ')
  if (!['w', 'b'].includes(color) || fields.length !== 6) return fen
  fields[1] = color
  // This is a visual, before-the-opponent-moves position. An en-passant target
  // belongs to the actual side to move, so it cannot survive changing that side.
  fields[3] = '-'
  return fields.join(' ')
}

export function premoveText(move) {
  return `${move.from}–${move.to}${move.promotion ? `=${move.promotion.toUpperCase()}` : ''}`
}
