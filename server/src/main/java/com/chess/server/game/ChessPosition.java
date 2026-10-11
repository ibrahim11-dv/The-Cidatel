package com.chess.server.game;

import com.github.bhlangonijr.chesslib.Board;
import com.github.bhlangonijr.chesslib.move.Move;
import java.util.List;

/** Rules boundary; callers never receive the mutable library board. */
public final class ChessPosition {
    private final Board board = new Board();

    public ChessPosition() {}

    // Trusted fixtures only. Online games begin at the standard starting position.
    ChessPosition(String fen) { board.loadFromFen(fen); }

    public String fen() { return board.getFen(); }
    public GameClock.Side turn() { return GameClock.Side.valueOf(board.getSideToMove().name()); }
    public List<String> legalMoves() { return board.legalMoves().stream().map(Move::toString).toList(); }

    public void play(String uci) {
        if (uci == null || !uci.matches("[a-h][1-8][a-h][1-8][qrbn]?")) {
            throw new IllegalArgumentException("Use a valid coordinate move with an optional promotion piece.");
        }
        Move legal = board.legalMoves().stream().filter(move -> move.toString().equals(uci))
                .findFirst().orElseThrow(() -> new IllegalArgumentException("Illegal chess move."));
        if (!board.doMove(legal, true)) throw new IllegalStateException("Legal move could not be applied.");
    }

    public boolean checkmate() { return board.isMated(); }
    public boolean stalemate() { return board.isStaleMate(); }
    public boolean insufficientMaterial() { return board.isInsufficientMaterial(); }
    public boolean repetition(int count) { return board.isRepetition(count); }
    public int halfMoves() { return board.getHalfMoveCounter(); }

    public String drawClaim(String intendedMove) {
        if (intendedMove != null) play(intendedMove);
        try {
            if (repetition(3)) return "threefold repetition";
            if (halfMoves() >= 100) return "fifty-move rule";
            return null;
        } finally {
            if (intendedMove != null) board.undoMove();
        }
    }
}
