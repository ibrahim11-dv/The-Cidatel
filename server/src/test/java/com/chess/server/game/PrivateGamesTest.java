package com.chess.server.game;

import org.junit.jupiter.api.Test;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import static org.junit.jupiter.api.Assertions.*;

class PrivateGamesTest {
    @Test void playersCannotStartTwoGamesAndBecomeAvailableAfterCompletion() {
        PrivateGames games = new PrivateGames();
        UUID host = UUID.randomUUID(), guest = UUID.randomUUID(), third = UUID.randomUUID();
        var first = games.create(host, 60, 0);
        var guestsOldInvitation = games.create(guest, 60, 0);
        var another = games.create(third, 60, 0);
        var match = games.join(first.code(), guest);
        assertEquals(match.id(), games.active(host).id());
        assertEquals(match.id(), games.active(guest).id());
        assertThrows(IllegalStateException.class, () -> games.create(host, 60, 0));
        assertThrows(IllegalStateException.class, () -> games.join(another.code(), guest));
        assertThrows(java.util.NoSuchElementException.class, () -> games.join(guestsOldInvitation.code(), third));
        games.get(match.id()).resign(host);
        assertNull(games.active(host));
        assertNull(games.active(guest));
        assertNotEquals(match.id(), games.join(another.code(), guest).id());
    }
    @Test void joinsOnceAndRestrictsRoomAndGameAccess() {
        PrivateGames games = new PrivateGames();
        UUID host = UUID.randomUUID(), guest = UUID.randomUUID(), outsider = UUID.randomUUID();
        var invitation = games.create(host, 180, 2);
        assertEquals(invitation, games.create(host, 180, 2));
        assertThrows(IllegalArgumentException.class, () -> games.join(invitation.code(), host));
        var game = games.join(invitation.code(), guest);
        assertEquals(game.id(), games.join(invitation.code(), guest).id());
        assertEquals(game.id(), games.status(invitation.code(), host).gameId());
        assertThrows(SecurityException.class, () -> games.join(invitation.code(), outsider));
        assertThrows(SecurityException.class, () -> games.get(game.id()).snapshot(outsider));
        assertThrows(IllegalStateException.class, () -> games.cancel(invitation.code(), host));
        games.get(game.id()).move(host, UUID.randomUUID(), 0, "e2e4");
        assertEquals(1, games.get(game.id()).snapshot(guest).moves().size());
    }

    @Test void onlyHostCanCancelPendingInvitation() {
        PrivateGames games = new PrivateGames();
        UUID host = UUID.randomUUID();
        var invite = games.create(host, 60, 0);
        assertThrows(SecurityException.class, () -> games.cancel(invite.code(), UUID.randomUUID()));
        games.cancel(invite.code(), host);
        assertThrows(java.util.NoSuchElementException.class, () -> games.join(invite.code(), UUID.randomUUID()));
    }

    @Test void awardsAnAbandonedGameOnlyAfterTheOpponentMissesTheReconnectGracePeriod() {
        AtomicLong now = new AtomicLong();
        PrivateGames games = new PrivateGames(now::get);
        UUID host = UUID.randomUUID(), guest = UUID.randomUUID();
        var game = games.join(games.create(host, 60, 0).code(), guest);

        now.set(119_000_000_000L);
        games.maintain();
        assertNull(games.state(game.id(), host).result());
        games.state(game.id(), host); // Host remains connected shortly before the grace period ends.
        now.set(120_000_000_000L);
        games.maintain();

        var result = games.state(game.id(), host).result();
        assertEquals("1-0", result.score());
        assertEquals("abandonment", result.reason());
        assertNull(games.active(host));
        assertNull(games.active(guest));
    }

    @Test void settlesMutualAbsenceAsAnAbandonedDraw() {
        AtomicLong now = new AtomicLong();
        PrivateGames games = new PrivateGames(now::get);
        UUID host = UUID.randomUUID(), guest = UUID.randomUUID();
        var game = games.join(games.create(host, 60, 0).code(), guest);

        now.set(120_000_000_000L);
        games.maintain();

        var result = games.state(game.id(), host).result();
        assertEquals("1/2-1/2", result.score());
        assertEquals("abandonment", result.reason());
    }
}
