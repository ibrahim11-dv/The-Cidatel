package com.chess.server.game;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ChessPositionTest {
    @Test void rejectsImpossibleMovementWithoutChangingState() {
        ChessPosition position = new ChessPosition();
        String original = position.fen();
        for (String move : new String[]{"e2e5", "a1a4", "e1e3", "e7e5", "e2e4q", "not a move"}) {
            assertThrows(IllegalArgumentException.class, () -> position.play(move));
            assertEquals(original, position.fen());
        }
        assertEquals(20, position.legalMoves().size());
        position.play("e2e4");
        assertEquals(GameClock.Side.BLACK, position.turn());
    }

    @Test void detectsCompleteGameAndPreservesRepetitionHistory() {
        ChessPosition mate = new ChessPosition();
        for (String move : new String[]{"f2f3", "e7e5", "g2g4", "d8h4"}) mate.play(move);
        assertTrue(mate.checkmate());
        assertTrue(mate.legalMoves().isEmpty());
        ChessPosition repeated = new ChessPosition();
        for (int i = 0; i < 4; i++) {
            for (String move : new String[]{"g1f3", "g8f6", "f3g1", "f6g8"}) repeated.play(move);
            assertEquals(i >= 1, repeated.repetition(3));
            assertEquals(i >= 3, repeated.repetition(5));
        }
    }

    @Test void supportsSpecialMovesAndRejectsCastlingThroughCheck() {
        ChessPosition castle = new ChessPosition("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
        castle.play("e1g1");
        assertTrue(castle.fen().startsWith("r3k2r/8/8/8/8/8/8/R4RK1"));
        ChessPosition attacked = new ChessPosition("4kr2/8/8/8/8/8/8/4K2R w K - 0 1");
        assertThrows(IllegalArgumentException.class, () -> attacked.play("e1g1"));
        ChessPosition ep = new ChessPosition();
        for (String move : new String[]{"e2e4", "a7a6", "e4e5", "d7d5", "e5d6"}) ep.play(move);
        assertTrue(ep.fen().startsWith("rnbqkbnr/1pp1pppp/p2P4/8/8/8/PPPP1PPP/RNBQKBNR"));
        ChessPosition promotion = new ChessPosition("7k/P7/8/8/8/8/8/7K w - - 0 1");
        assertThrows(IllegalArgumentException.class, () -> promotion.play("a7a8"));
        promotion.play("a7a8n");
        assertTrue(promotion.fen().startsWith("N6k/"));
        assertTrue(promotion.insufficientMaterial());
    }
}
