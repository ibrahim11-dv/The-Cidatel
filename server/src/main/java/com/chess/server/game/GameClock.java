package com.chess.server.game;

import java.util.Objects;
import java.util.function.LongSupplier;

/** Server-owned monotonic clock. The game service must validate a move before calling completeMove. */
public final class GameClock {
    public enum Side { WHITE, BLACK;
        public Side opposite() { return this == WHITE ? BLACK : WHITE; }
    }
    public record Snapshot(long whiteMillis, long blackMillis, Side running, Side expired) {}
    public record Saved(int initialSeconds, int incrementSeconds, long whiteNanos, long blackNanos,
                        Side running, Side expired, boolean started, boolean stopped) {}

    public synchronized Saved save() {
        settle();
        return new Saved(initialSeconds, incrementSeconds(), whiteNanos, blackNanos, running, expired, started, stopped);
    }

    static GameClock restore(Saved state, long downtimeMillis, LongSupplier nanoTime) {
        if (state.whiteNanos() < 0 || state.blackNanos() < 0 || downtimeMillis < 0) throw new IllegalArgumentException("Invalid saved clock.");
        GameClock clock = new GameClock(state.initialSeconds(), state.incrementSeconds(), nanoTime);
        clock.whiteNanos = state.whiteNanos();
        clock.blackNanos = state.blackNanos();
        clock.running = state.running();
        clock.expired = state.expired();
        clock.started = state.started();
        clock.stopped = state.stopped();
        clock.anchor = nanoTime.getAsLong();
        if (clock.running != null) {
            long remaining = clock.running == Side.WHITE ? clock.whiteNanos : clock.blackNanos;
            long elapsed = Math.min(downtimeMillis, remaining / 1_000_000L + 1) * 1_000_000L;
            if (clock.running == Side.WHITE) clock.whiteNanos = Math.max(0, remaining - elapsed);
            else clock.blackNanos = Math.max(0, remaining - elapsed);
            clock.settle();
        }
        return clock;
    }

    private final LongSupplier nanoTime;
    private final long incrementNanos;
    private final int initialSeconds;
    private long whiteNanos;
    private long blackNanos;
    private long anchor;
    private Side running;
    private Side expired;
    private boolean started;
    private boolean stopped;

    public GameClock(int initialSeconds, int incrementSeconds) {
        this(initialSeconds, incrementSeconds, System::nanoTime);
    }

    GameClock(int initialSeconds, int incrementSeconds, LongSupplier nanoTime) {
        if (initialSeconds < 15 || initialSeconds > 10800 || incrementSeconds < 0 || incrementSeconds > 180) {
            throw new IllegalArgumentException("Time control must be 15 seconds to 3 hours with 0–180 seconds increment.");
        }
        this.nanoTime = Objects.requireNonNull(nanoTime);
        this.initialSeconds = initialSeconds;
        whiteNanos = blackNanos = initialSeconds * 1_000_000_000L;
        incrementNanos = incrementSeconds * 1_000_000_000L;
    }

    /** Start only once, when both players have been assigned. */
    public synchronized void start() {
        if (started || stopped) throw new IllegalStateException("Clock already started or stopped.");
        started = true;
        running = Side.WHITE;
        anchor = nanoTime.getAsLong();
    }

    /** False means the mover has flagged; no increment or turn change is applied. */
    public synchronized boolean completeMove(Side mover) {
        Objects.requireNonNull(mover);
        if (!started || stopped || expired != null) return false;
        if (mover != running) throw new IllegalStateException("It is not this player's turn.");
        settle();
        if (expired != null) return false;
        if (mover == Side.WHITE) whiteNanos += incrementNanos;
        else blackNanos += incrementNanos;
        running = mover.opposite();
        return true;
    }

    public synchronized Snapshot snapshot() {
        settle();
        return new Snapshot(millis(whiteNanos), millis(blackNanos), running, expired);
    }

    /** Freeze a finished game; repeated calls preserve its final values. */
    public synchronized void stop() {
        settle();
        stopped = true;
        running = null;
    }

    private void settle() {
        if (running == null) return;
        long now = nanoTime.getAsLong();
        long elapsed = now - anchor; // nanoTime subtraction also handles counter wraparound.
        if (elapsed < 0) throw new IllegalStateException("Monotonic time moved backwards.");
        anchor = now;
        if (running == Side.WHITE) whiteNanos = Math.max(0, whiteNanos - elapsed);
        else blackNanos = Math.max(0, blackNanos - elapsed);
        if ((running == Side.WHITE ? whiteNanos : blackNanos) == 0) {
            expired = running;
            running = null;
        }
    }

    private static long millis(long nanos) { return (nanos + 999_999L) / 1_000_000L; }
    int initialSeconds() { return initialSeconds; }
    int incrementSeconds() { return (int) (incrementNanos / 1_000_000_000L); }
}
