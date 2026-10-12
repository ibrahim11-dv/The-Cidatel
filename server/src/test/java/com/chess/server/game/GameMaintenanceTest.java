package com.chess.server.game;

import com.chess.server.game.persistence.GameStore;
import org.junit.jupiter.api.Test;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;

class GameMaintenanceTest {
    @Test void evictsFinishedMemoryButReloadsDurableResult() {
        GameStore store = mock(GameStore.class);
        Map<UUID, GameSession.Saved> disk = new HashMap<>();
        when(store.active()).thenReturn(List.of());
        doAnswer(call -> { GameSession.Saved saved = call.getArgument(0); disk.put(saved.id(), saved); return null; }).when(store).save(any());
        when(store.find(any())).thenAnswer(call -> Optional.ofNullable(disk.get(call.getArgument(0))));
        AtomicLong now = new AtomicLong();
        PrivateGames registry = new PrivateGames(store, now::get);
        UUID white = UUID.randomUUID(), black = UUID.randomUUID();
        var room = registry.create(white, 60, 0);
        var game = registry.join(room.code(), black);
        registry.change(game.id(), session -> session.resign(white));
        now.set(900_000_000_000L);
        registry.maintain();
        assertEquals("0-1", registry.state(game.id(), black).result().score());
        verify(store).find(game.id());
        assertNotNull(disk.get(game.id()));
        assertNull(registry.active(white));
    }
}
