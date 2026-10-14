const STANDARD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const STANDARD_RANKS = [8, 7, 6, 5, 4, 3, 2, 1]

function isSquare(square) {
  return typeof square === 'string' && /^[a-h][1-8]$/.test(square)
}

function boardOrder(flipped) {
  return flipped
    ? { files: [...STANDARD_FILES].reverse(), ranks: [...STANDARD_RANKS].reverse() }
    : { files: STANDARD_FILES, ranks: STANDARD_RANKS }
}

function center(square, order) {
  return {
    x: (order.files.indexOf(square[0]) + .5) * 12.5,
    y: (order.ranks.indexOf(Number(square[1])) + .5) * 12.5,
  }
}

export function boardArrows(arrows, flipped = false) {
  const order = boardOrder(flipped)
  return (Array.isArray(arrows) ? arrows : []).filter((arrow) => isSquare(arrow?.from) && isSquare(arrow?.to) && arrow.from !== arrow.to)
    .map((arrow) => ({ ...arrow, ...center(arrow.from, order), x2: center(arrow.to, order).x, y2: center(arrow.to, order).y }))
}
