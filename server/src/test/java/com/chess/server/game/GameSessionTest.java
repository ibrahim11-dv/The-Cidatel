package com.chess.server.game;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import static org.junit.jupiter.api.Assertions.*;

class GameSessionTest {
    private final UUID white = UUID.randomUUID(), black = UUID.randomUUID();

    @Test void drawOffersRequireOpponentResponseAndMovesDeclineThem() {
        GameSession game = new GameSession(white, black, 60, 0);
        assertEquals(white, game.offerDraw(white).drawOfferedBy());
        assertThrows(IllegalStateException.class, () -> game.respondToDraw(white, true));
        game.move(white, UUID.randomUUID(), 0, "e2e4");
        assertEquals(white, game.snapshot(black).drawOfferedBy());
        game.move(black, UUID.randomUUID(), 1, "e7e5");
        assertNull(game.snapshot(white).drawOfferedBy());
        game.offerDraw(black);
        assertNull(game.respondToDraw(white, false).drawOfferedBy());
        game.offerDraw(white);
        assertEquals(new GameSession.Result("1/2-1/2", "agreement"), game.respondToDraw(black, true).result());
        assertNull(game.snapshot(white).clocks().running());
    }

    @Test void intendedRepetitionClaimPreservesPositionAndHistory() {
        GameSession game = new GameSession(white, black, 60, 0);
        assertThrows(IllegalArgumentException.class, () -> game.claimDraw(white, 0, "e2e4"));
        assertTrue(game.snapshot(white).moves().isEmpty());
        String[] sequence = {"g1f3", "g8f6", "f3g1", "f6g8", "g1f3", "g8f6", "f3g1"};
        for (int i = 0; i < sequence.length; i++) game.move(i % 2 == 0 ? white : black, UUID.randomUUID(), i, sequence[i]);
        String before = game.snapshot(black).fen();
        assertThrows(IllegalStateException.class, () -> game.claimDraw(white, 7, "f6g8"));
        assertThrows(IllegalStateException.class, () -> game.claimDraw(black, 6, "f6g8"));
        GameSession.Snapshot claimed = game.claimDraw(black, 7, "f6g8");
        assertEquals(before, claimed.fen());
        assertEquals(7, claimed.moves().size());
        assertEquals(new GameSession.Result("1/2-1/2", "threefold repetition"), claimed.result());
    }

    @Test void enforcesIdentityTurnAndRevisionAndMakesRetriesIdempotent() {
        GameSession game = new GameSession(white, black, 60, 1);
        assertThrows(SecurityException.class, () -> game.snapshot(UUID.randomUUID()));
        assertThrows(IllegalStateException.class, () -> game.move(black, UUID.randomUUID(), 0, "e7e5"));
        assertThrows(IllegalArgumentException.class, () -> game.move(white, UUID.randomUUID(), 0, "e2e5"));
        UUID command = UUID.randomUUID();
        game.move(white, command, 0, "e2e4");
        assertEquals(1, game.move(white, command, 0, "e2e4").moves().size());
        assertThrows(IllegalArgumentException.class, () -> game.move(white, command, 0, "d2d4"));
        assertThrows(IllegalStateException.class, () -> game.move(black, UUID.randomUUID(), 0, "e7e5"));
        assertEquals(2, game.move(black, UUID.randomUUID(), 1, "e7e5").moves().size());
        assertEquals(2, game.move(white, command, 0, "e2e4").moves().size());
        assertThrows(UnsupportedOperationException.class, () -> game.snapshot(white).moves().clear());
    }

    @Test void completesMateAndRejectsFurtherPlay() {
        GameSession game = new GameSession(white, black, 60, 0);
        String[] moves = {"f2f3", "e7e5", "g2g4", "d8h4"};
        for (int i = 0; i < moves.length; i++) game.move(i % 2 == 0 ? white : black, UUID.randomUUID(), i, moves[i]);
        assertEquals(new GameSession.Result("0-1", "checkmate"), game.snapshot(white).result());
        assertNull(game.snapshot(black).clocks().running());
        assertThrows(IllegalStateException.class, () -> game.move(white, UUID.randomUUID(), 4, "a2a3"));
        assertEquals("checkmate", game.resign(black).result().reason());
    }

    @Test void expiryPrecedesMovesAndResignation() {
        AtomicLong now = new AtomicLong();
        GameSession game = new GameSession(white, black, new ChessPosition(), new GameClock(15, 1, now::get));
        now.set(15_000_000_000L);
        assertThrows(IllegalStateException.class, () -> game.move(white, UUID.randomUUID(), 0, "e2e4"));
        assertTrue(game.snapshot(black).moves().isEmpty());
        assertEquals(new GameSession.Result("0-1", "timeout"), game.resign(black).result());
    }

    @Test void preventsSelfPlayAndSupportsResignation() {
        assertThrows(IllegalArgumentException.class, () -> new GameSession(white, white, 60, 0));
        GameSession game = new GameSession(white, black, 60, 0);
        assertEquals(new GameSession.Result("1-0", "resignation"), game.resign(black).result());
    }
}
