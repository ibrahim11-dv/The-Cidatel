package com.chess.server.game;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class RematchTest {
    @Test void requiresBothPlayersSwapsColorsAndPreservesControlWithoutDuplicating() {
        PrivateGames games = new PrivateGames();
        UUID host = UUID.randomUUID(), guest = UUID.randomUUID();
        var invite = games.create(host, 180, 2);
        var first = games.join(invite.code(), guest);
        assertThrows(IllegalStateException.class, () -> games.requestRematch(first.id(), host));
        games.get(first.id()).resign(guest);
        assertThrows(SecurityException.class, () -> games.requestRematch(first.id(), UUID.randomUUID()));
        assertNull(games.requestRematch(first.id(), host).gameId());
        assertNull(games.requestRematch(first.id(), host).gameId());
        assertNull(games.cancelRematch(first.id(), guest).requestedBy());
        games.requestRematch(first.id(), guest);
        var agreed = games.requestRematch(first.id(), host);
        assertNotNull(agreed.gameId());
        assertEquals(agreed, games.requestRematch(first.id(), guest));
        assertEquals(agreed, games.cancelRematch(first.id(), guest));
        var next = games.get(agreed.gameId());
        var state = next.snapshot(host);
        assertEquals(guest, state.white());
        assertEquals(host, state.black());
        assertTrue(state.moves().isEmpty());
        assertNull(state.result());
        assertEquals(180, next.initialSeconds());
        assertEquals(2, next.incrementSeconds());
    }
}
