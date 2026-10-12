package com.chess.server.game;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import static org.junit.jupiter.api.Assertions.*;

class GameRecoveryTest {
    @Test void jsonRoundTripPreservesHistoryClocksOffersAndAcceptedCommands() throws Exception {
        UUID white = UUID.randomUUID(), black = UUID.randomUUID(), command = UUID.randomUUID();
        AtomicLong now = new AtomicLong();
        GameSession game = new GameSession(white, black, new ChessPosition(), new GameClock(60, 1, now::get));
        now.set(2_000_000_000L);
        game.move(white, command, 0, "e2e4");
        game.offerDraw(white);
        ObjectMapper json = new ObjectMapper();
        GameSession.Saved saved = json.readValue(json.writeValueAsString(game.save(1000)), GameSession.Saved.class);
        GameSession restored = GameSession.restore(saved, 4000, now::get);
        var state = restored.snapshot(black);
        assertEquals(game.snapshot(white).fen(), state.fen());
        assertEquals(59_000, state.clocks().whiteMillis());
        assertEquals(57_000, state.clocks().blackMillis());
        assertEquals(white, state.drawOfferedBy());
        assertEquals(1, restored.move(white, command, 0, "e2e4").moves().size());
        restored.move(black, UUID.randomUUID(), 1, "e7e5");
        assertEquals(2, restored.snapshot(white).moves().size());
    }

    @Test void downtimeCanFlagButFinishedClocksRemainFrozen() {
        UUID white = UUID.randomUUID(), black = UUID.randomUUID();
        AtomicLong now = new AtomicLong();
        GameSession game = new GameSession(white, black, new ChessPosition(), new GameClock(15, 0, now::get));
        GameSession restored = GameSession.restore(game.save(1000), 16000, now::get);
        assertEquals(new GameSession.Result("0-1", "timeout"), restored.snapshot(white).result());
        var finished = restored.save(16000);
        var later = GameSession.restore(finished, 99999999, now::get).snapshot(white);
        assertEquals(restored.snapshot(white).clocks(), later.clocks());
        assertEquals(restored.snapshot(white).result(), later.result());
    }
}
