package com.chess.server.game;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import static org.junit.jupiter.api.Assertions.*;

class MatchmakingTest {
    @Test void matchesCompatiblePlayersOnceAndReportsMatchOnLateCancellation() {
        PrivateGames games = new PrivateGames();
        UUID first = UUID.randomUUID(), second = UUID.randomUUID(), other = UUID.randomUUID();
        assertTrue(games.findOpponent(first, 60, 1).waiting());
        assertTrue(games.findOpponent(first, 60, 1).waiting());
        assertTrue(games.findOpponent(other, 180, 2).waiting());
        var matched = games.findOpponent(second, 60, 1);
        assertFalse(matched.waiting());
        assertEquals(matched.gameId(), games.findOpponent(first, 60, 1).gameId());
        assertEquals(matched.gameId(), games.cancelMatchmaking(first).gameId());
        var state = games.get(matched.gameId()).snapshot(first);
        assertNotEquals(state.white(), state.black());
        assertNull(games.active(other));
    }

    @Test void cancelledAndExpiredPlayersAreNotMatched() {
        AtomicLong now = new AtomicLong();
        PrivateGames games = new PrivateGames(now::get);
        UUID first = UUID.randomUUID(), second = UUID.randomUUID(), third = UUID.randomUUID();
        games.findOpponent(first, 60, 0);
        games.cancelMatchmaking(first);
        assertTrue(games.findOpponent(second, 60, 0).waiting());
        now.set(30_000_000_000L);
        assertTrue(games.findOpponent(third, 60, 0).waiting());
        assertNull(games.active(second));
        assertThrows(IllegalStateException.class, () -> games.findOpponent(third, 180, 0));
        games.cancelMatchmaking(third);
        games.create(third, 60, 0);
        assertThrows(IllegalStateException.class, () -> games.findOpponent(third, 60, 0));
    }
}
