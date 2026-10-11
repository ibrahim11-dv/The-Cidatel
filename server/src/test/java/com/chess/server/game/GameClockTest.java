package com.chess.server.game;

import org.junit.jupiter.api.Test;
import java.util.concurrent.atomic.AtomicLong;
import static com.chess.server.game.GameClock.Side.*;
import static org.junit.jupiter.api.Assertions.*;

class GameClockTest {
    @Test void waitingDoesNotConsumeTimeAndMovesApplyIncrementToOnlyTheMover() {
        AtomicLong now = new AtomicLong();
        GameClock clock = new GameClock(60, 2, now::get);
        now.set(100_000_000_000L);
        assertEquals(60_000, clock.snapshot().whiteMillis());
        clock.start();
        now.addAndGet(3_000_000_000L);
        assertTrue(clock.completeMove(WHITE));
        assertEquals(new GameClock.Snapshot(59_000, 60_000, BLACK, null), clock.snapshot());
        now.addAndGet(500_000_000L);
        assertTrue(clock.completeMove(BLACK));
        assertEquals(new GameClock.Snapshot(59_000, 61_500, WHITE, null), clock.snapshot());
        assertThrows(IllegalStateException.class, clock::start);
        assertThrows(IllegalStateException.class, () -> clock.completeMove(BLACK));
    }

    @Test void exactDeadlineRejectsMoveAndCannotBeRescuedByIncrement() {
        AtomicLong now = new AtomicLong();
        GameClock clock = new GameClock(15, 180, now::get);
        clock.start();
        now.set(15_000_000_000L);
        assertFalse(clock.completeMove(WHITE));
        assertEquals(new GameClock.Snapshot(0, 15_000, null, WHITE), clock.snapshot());
        assertFalse(clock.completeMove(BLACK));
    }

    @Test void frequentSnapshotsDoNotDiscardSubmillisecondTimeAndStopFreezesClocks() {
        AtomicLong now = new AtomicLong();
        GameClock clock = new GameClock(60, 0, now::get);
        clock.start();
        for (int i = 0; i < 10000; i++) {
            now.addAndGet(100_000);
            clock.snapshot();
        }
        assertEquals(59_000, clock.snapshot().whiteMillis());
        clock.stop();
        now.addAndGet(900_000_000_000L);
        assertEquals(new GameClock.Snapshot(59_000, 60_000, null, null), clock.snapshot());
        assertFalse(clock.completeMove(WHITE));
    }

    @Test void rejectsUnsupportedControls() {
        assertThrows(IllegalArgumentException.class, () -> new GameClock(0, 0));
        assertThrows(IllegalArgumentException.class, () -> new GameClock(60, -1));
        assertThrows(IllegalArgumentException.class, () -> new GameClock(10801, 0));
        assertThrows(IllegalArgumentException.class, () -> new GameClock(60, 181));
    }
}
