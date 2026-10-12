package com.chess.server;

import com.chess.server.game.GameSession;
import com.chess.server.game.PrivateGames;
import com.chess.server.game.persistence.GameStore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {"spring.datasource.url=jdbc:h2:mem:game-store-test;DB_CLOSE_DELAY=-1", "spring.jpa.hibernate.ddl-auto=create-drop"})
class GameStoreIntegrationTest {
    @Autowired GameStore store;

    @Test void freshRegistryRecoversAcceptedMovesAndCompletedGames() {
        UUID white = UUID.randomUUID(), black = UUID.randomUUID(), command = UUID.randomUUID();
        PrivateGames registry = new PrivateGames(store);
        var room = registry.create(white, 60, 1);
        var joined = registry.join(room.code(), black);
        registry.change(joined.id(), game -> game.move(white, command, 0, "e2e4"));
        PrivateGames restarted = new PrivateGames(store);
        assertEquals(joined.id(), restarted.active(white).id());
        assertEquals(1, restarted.active(black).moves().size());
        assertEquals(1, restarted.change(joined.id(), game -> game.move(white, command, 0, "e2e4")).moves().size());
        restarted.change(joined.id(), game -> game.resign(black));
        PrivateGames finishedRestart = new PrivateGames(store);
        assertNull(finishedRestart.active(white));
        assertEquals("1-0", finishedRestart.state(joined.id(), white).result().score());
    }

    @Test void persistsAndReloadsAnActiveGameThenRetainsItsCompletedRecord() {
        UUID white = UUID.randomUUID(), black = UUID.randomUUID(), command = UUID.randomUUID();
        GameSession game = new GameSession(white, black, 60, 1);
        game.move(white, command, 0, "e2e4");
        GameSession.Saved first = game.save(System.currentTimeMillis());
        store.save(first);
        assertTrue(store.active().stream().anyMatch(state -> state.id().equals(first.id())));
        GameSession.Saved loaded = store.find(first.id()).orElseThrow();
        assertEquals(first, loaded);
        GameSession restored = GameSession.restore(loaded, System.currentTimeMillis());
        assertEquals(1, restored.move(white, command, 0, "e2e4").moves().size());
        restored.move(black, UUID.randomUUID(), 1, "e7e5");
        restored.resign(white);
        store.save(restored.save(first.savedAtMillis() + 1000));
        assertFalse(store.active().stream().anyMatch(state -> state.id().equals(first.id())));
        assertEquals("resignation", store.find(first.id()).orElseThrow().result().reason());
        assertThrows(IllegalStateException.class, () -> store.save(first));
        assertEquals(2, store.find(first.id()).orElseThrow().moves().size());
    }
}
