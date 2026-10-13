import { Chess } from 'chess.js'

function uciMove(uci) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), ...(uci[4] ? { promotion: uci[4] } : {}) }
}

// Lichess stores the position before the opponent's last move. The first UCI
// move establishes the position shown to the player; the remainder is the line.
function lichessPuzzle({ id, fen, moves, rating, themes, gameUrl, title, note }) {
  const chess = new Chess(fen)
  const line = moves.split(' ')
  chess.move(uciMove(line.shift()))
  return {
    id: `lichess-${id}`, title, theme: themes[0], themes, side: chess.turn(), fen: chess.fen(),
    solution: line.map((move) => chess.move(uciMove(move)).san), rating,
    note, source: { provider: 'Lichess Open Database', license: 'CC0', puzzleId: id, gameUrl },
  }
}

function lichessStudy({ id, fen, moves, rating, themes, gameUrl, title, note }) {
  const chess = new Chess(fen)
  return {
    id: `lichess-${id}`, title, theme: themes[0], themes, side: chess.turn(), fen: chess.fen(),
    solution: moves.map((move) => chess.move(uciMove(move)).san), rating,
    note, source: { provider: 'Lichess Open Database', license: 'CC0', puzzleId: id, gameUrl },
  }
}

const citadelStudies = [
  {
    id: 'quiet-crown',
    title: 'Quiet crown',
    theme: 'Mate in one',
    themes: ['Mate in one'],
    difficulty: 'Foundation',
    side: 'w',
    fen: '6k1/8/5QK1/8/8/8/8/8 w - - 0 1',
    solution: ['Qg7#'],
    note: 'A queen can move beside the king when the square is protected.',
  },
  {
    id: 'eighth-rank',
    title: 'Eighth rank',
    theme: 'Mate in one',
    themes: ['Mate in one'],
    difficulty: 'Foundation',
    side: 'w',
    fen: '7k/6pp/5Q2/8/8/8/6PP/6K1 w - - 0 1',
    solution: ['Qf8#'],
    note: 'The queen closes every flight square from the back rank.',
  },
  {
    id: 'the-file',
    title: 'The far file',
    theme: 'Mate in one',
    themes: ['Mate in one'],
    difficulty: 'Foundation',
    side: 'w',
    fen: 'k7/2Q5/2K5/8/8/8/8/8 w - - 0 1',
    solution: ['Qb7#'],
    note: 'The queen reaches the corner from the neighbouring file.',
  },
  {
    id: 'diagonal-light',
    title: 'Diagonal light',
    theme: 'Mate in one',
    themes: ['Mate in one'],
    difficulty: 'Foundation',
    side: 'w',
    fen: '8/8/8/8/8/5K2/5Q2/7k w - - 0 1',
    solution: ['Qg2#'],
    note: 'The same idea works from the other edge of the board.',
  },
  {
    id: 'legals-mate',
    title: "Légal's finish",
    theme: 'Combination',
    themes: ['Combination', 'Sacrifice'],
    difficulty: 'Club',
    side: 'w',
    fen: 'rn1qkbnr/ppp2p1p/3p2p1/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5',
    solution: ['Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'],
    note: 'Give up the queen to bring the minor pieces into the attack.',
  },
  {
    id: 'fools-mate',
    title: 'The open diagonal',
    theme: 'Mate in one',
    themes: ['Mate in one'],
    difficulty: 'Foundation',
    side: 'b',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2',
    solution: ['Qh4#'],
    note: 'When the king-side pawns advance carelessly, the diagonal opens.',
  },
]

const lichessStudies = [
  lichessPuzzle({
    id: '00sHx', title: 'The caged king', rating: 1760, themes: ['Mate in two', 'Middlegame'],
    fen: 'q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17',
    moves: 'e8d7 a2e6 d7d8 f7f8', gameUrl: 'https://lichess.org/yyznGmXs/black#34',
    note: 'The queen and bishop coordinate to keep the king inside its cage.',
  }),
  lichessPuzzle({
    id: '00sJ9', title: 'Drawn to the fork', rating: 2671, themes: ['Attraction', 'Fork', 'Sacrifice'],
    fen: 'r3r1k1/p4ppp/2p2n2/1p6/3P1qb1/2NQR3/PPB2PP1/R1B3K1 w - - 5 18',
    moves: 'e3g3 e8e1 g1h2 e1c1 a1c1 f4h6 h2g1 h6c1', gameUrl: 'https://lichess.org/gyFeQsOE#35',
    note: 'A forcing capture pulls the king into a tactical fork.',
  }),
  lichessPuzzle({
    id: '00sJb', title: 'The seventh-rank fork', rating: 2235, themes: ['Fork', 'Middlegame'],
    fen: 'Q1b2r1k/p2np2p/5bp1/q7/5P2/4B3/PPP3PP/2KR1B1R w - - 1 17',
    moves: 'd1d7 a5e1 d7d1 e1e3 c1b1 e3b6', gameUrl: 'https://lichess.org/kiuvTFoE#33',
    note: 'Keep the attack moving while the queen and rook are overloaded.',
  }),
  lichessPuzzle({
    id: '00sO1', title: 'A discovered attack', rating: 998, themes: ['Discovered attack', 'Middlegame'],
    fen: '1k1r4/pp3pp1/2p1p3/4b3/P3n1P1/8/KPP2PN1/3rBR1R b - - 2 31',
    moves: 'b8c7 e1a5 b7b6 f1d1', gameUrl: 'https://lichess.org/vsfFkG0s/black#62',
    note: 'Open the line at the moment the defender cannot keep every piece covered.',
  }),
  lichessStudy({
    id: 'QgvN2', title: 'The pinned queen', rating: 1303, themes: ['Pin', 'Endgame'],
    fen: '4rR2/6k1/6pp/4q1b1/6P1/P1Q5/KP5P/8 w - - 1 1',
    moves: ['f8e8', 'e5c3', 'b2c3'], gameUrl: 'https://lichess.org/0YFrmgI6',
    note: 'Use the pin to win the defender when the king has no safe recapture.',
  }),
  lichessStudy({
    id: '8XMVq', title: 'Rooks on the seventh', rating: 1608, themes: ['Skewer', 'Endgame'],
    fen: 'R7/P4k2/8/4p2p/r7/6K1/5P2/8 w - - 1 1',
    moves: ['a8h8', 'a4a7', 'h8h7', 'f7f6', 'h7a7'], gameUrl: 'https://lichess.org/wd0OX9xu',
    note: 'A checking rook attack forces the king away before the loose rook falls.',
  }),
  lichessStudy({
    id: 'TuFQi', title: 'The crowded back rank', rating: 1340, themes: ['Back-rank tactics', 'Mate in three'],
    fen: '4rbk1/p1p3pp/4r3/2Pq4/8/8/P4QPP/4RRK1 w - - 0 1',
    moves: ['f2f7', 'g8h8', 'f7f8', 'e8f8', 'f1f8'], gameUrl: 'https://lichess.org/NAIyEHCA',
    note: 'Deflect the back-rank guard before delivering the final rook check.',
  }),
  lichessStudy({
    id: 'GzQ2K', title: 'The passed pawn', rating: 1463, themes: ['Endgame', 'Promotion'],
    fen: '8/5ppk/2QP3p/8/8/p4P2/q1P2P2/5K2 b - - 0 1',
    moves: ['a2b1', 'f1g2', 'a3a2', 'c6e4', 'g7g6', 'e4d5', 'a2a1q'], gameUrl: 'https://lichess.org/aaBIEICB',
    note: 'The passed pawn’s route to promotion matters more than the material count.',
  }),
]

export const puzzles = [...citadelStudies, ...lichessStudies]
