package com.chess.server.game;

import com.chess.server.game.persistence.GameStore;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

class GamePersistenceFailureTest {
    @Test void failedMoveCheckpointDoesNotRemainAcceptedInMemory() {
        GameStore store = mock(GameStore.class);
        when(store.active()).thenReturn(List.of());
        PrivateGames registry = new PrivateGames(store);
        UUID white = UUID.randomUUID(), black = UUID.randomUUID(), command = UUID.randomUUID();
        var room = registry.create(white, 60, 1);
        var first = registry.join(room.code(), black);
        doThrow(new IllegalStateException("Storage unavailable")).when(store).save(any());
        assertThrows(IllegalStateException.class, () -> registry.change(first.id(), game -> game.move(white, command, 0, "e2e4")));
        var rolledBack = registry.state(first.id(), white);
        assertEquals(first.fen(), rolledBack.fen());
        assertTrue(rolledBack.moves().isEmpty());
        assertEquals(GameClock.Side.WHITE, rolledBack.clocks().running());
        doNothing().when(store).save(any());
        assertEquals(1, registry.change(first.id(), game -> game.move(white, command, 0, "e2e4")).moves().size());
    }

    @Test void failedCreationDoesNotAssignEitherPlayer() {
        GameStore store = mock(GameStore.class);
        when(store.active()).thenReturn(List.of());
        doThrow(new IllegalStateException("Storage unavailable")).when(store).save(any());
        PrivateGames registry = new PrivateGames(store);
        UUID white = UUID.randomUUID(), black = UUID.randomUUID();
        var room = registry.create(white, 60, 0);
        assertThrows(IllegalStateException.class, () -> registry.join(room.code(), black));
        assertNull(registry.active(white));
        assertNull(registry.active(black));
        assertNull(registry.status(room.code(), white).gameId());
    }
}
