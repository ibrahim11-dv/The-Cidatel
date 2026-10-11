package com.chess.server.game;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;

/** Single-process registry; durable storage and restart recovery are still required. */
@Service
public class PrivateGames {
    public record Invitation(UUID code, UUID host, int seconds, int increment, Instant expiresAt, UUID gameId) {}
    private final Map<UUID, Invitation> invitations = new HashMap<>();
    private final Map<UUID, GameSession> games = new HashMap<>();
    private final Map<UUID, UUID> activeByPlayer = new HashMap<>();
    public record QueueState(boolean waiting, UUID gameId) {}
    private record Waiting(int seconds, int increment, long seenAt) {}
    private final Map<UUID, Waiting> queue = new LinkedHashMap<>();
    private final java.util.function.LongSupplier monotonic;

    public PrivateGames() { this(System::nanoTime); }
    PrivateGames(java.util.function.LongSupplier monotonic) { this.monotonic = monotonic; }

    public synchronized QueueState findOpponent(UUID player, int seconds, int increment) {
        new GameClock(seconds, increment);
        GameSession.Snapshot active = active(player);
        if (active != null) return new QueueState(false, active.id());
        long now = monotonic.getAsLong();
        queue.values().removeIf(entry -> now - entry.seenAt() >= 30_000_000_000L);
        if (invitations.values().stream().anyMatch(invite -> invite.host().equals(player)
                && invite.gameId() == null && invite.expiresAt().isAfter(Instant.now()))) {
            throw new IllegalStateException("Cancel your private invitation before matchmaking.");
        }
        Waiting existing = queue.get(player);
        if (existing != null && (existing.seconds() != seconds || existing.increment() != increment)) {
            throw new IllegalStateException("Cancel matchmaking before changing the time control.");
        }
        UUID opponent = queue.entrySet().stream().filter(entry -> !entry.getKey().equals(player)
                && entry.getValue().seconds() == seconds && entry.getValue().increment() == increment)
                .map(Map.Entry::getKey).findFirst().orElse(null);
        if (opponent == null) {
            queue.put(player, new Waiting(seconds, increment, now));
            return new QueueState(true, null);
        }
        // Queue operations and game assignment share one lock, preventing double matches.
        boolean firstIsWhite = java.util.concurrent.ThreadLocalRandom.current().nextBoolean();
        GameSession game = new GameSession(firstIsWhite ? opponent : player, firstIsWhite ? player : opponent, seconds, increment);
        GameSession.Snapshot state = game.snapshot(player);
        games.put(state.id(), game);
        activeByPlayer.put(player, state.id());
        activeByPlayer.put(opponent, state.id());
        queue.remove(player);
        queue.remove(opponent);
        return new QueueState(false, state.id());
    }

    public synchronized QueueState cancelMatchmaking(UUID player) {
        queue.remove(player);
        GameSession.Snapshot active = active(player);
        return new QueueState(false, active == null ? null : active.id());
    }

    public synchronized Invitation create(UUID host, int seconds, int increment) {
        new GameClock(seconds, increment); // Validate before retaining any state.
        requireAvailable(host);
        queue.remove(host);
        Instant now = Instant.now();
        invitations.values().removeIf(invite -> invite.expiresAt().isBefore(now));
        for (Invitation invitation : invitations.values()) {
            if (invitation.host().equals(host) && invitation.gameId() == null) {
                if (invitation.seconds() == seconds && invitation.increment() == increment) return invitation;
                throw new IllegalStateException("Cancel your existing invitation first.");
            }
        }
        Invitation invitation = new Invitation(UUID.randomUUID(), host, seconds, increment, now.plusSeconds(900), null);
        invitations.put(invitation.code(), invitation);
        return invitation;
    }

    public synchronized GameSession.Snapshot join(UUID code, UUID player) {
        Invitation invite = invitation(code);
        if (invite.host().equals(player)) throw new IllegalArgumentException("You cannot join your own invitation.");
        if (invite.gameId() != null) return get(invite.gameId()).snapshot(player);
        requireAvailable(invite.host());
        requireAvailable(player);
        GameSession game = new GameSession(invite.host(), player, invite.seconds(), invite.increment());
        GameSession.Snapshot snapshot = game.snapshot(player);
        games.put(snapshot.id(), game);
        activeByPlayer.put(invite.host(), snapshot.id());
        activeByPlayer.put(player, snapshot.id());
        queue.remove(invite.host());
        queue.remove(player);
        invitations.values().removeIf(other -> other.gameId() == null && other.host().equals(player));
        invitations.put(code, new Invitation(code, invite.host(), invite.seconds(), invite.increment(), invite.expiresAt(), snapshot.id()));
        return snapshot;
    }

    public synchronized Invitation status(UUID code, UUID host) {
        Invitation invite = invitation(code);
        if (!invite.host().equals(host)) throw new SecurityException("Only the host may inspect this invitation.");
        return invite;
    }

    public synchronized void cancel(UUID code, UUID host) {
        Invitation invite = status(code, host);
        if (invite.gameId() != null) throw new IllegalStateException("The game has already started.");
        invitations.remove(code);
    }

    public synchronized GameSession get(UUID id) {
        GameSession game = games.get(id);
        if (game == null) throw new NoSuchElementException("Game not found.");
        return game;
    }

    public synchronized GameSession.Snapshot active(UUID player) {
        UUID id = activeByPlayer.get(player);
        if (id == null) return null;
        GameSession.Snapshot state = get(id).snapshot(player);
        if (state.result() != null) {
            activeByPlayer.remove(state.white(), id);
            activeByPlayer.remove(state.black(), id);
            return null;
        }
        return state;
    }

    private void requireAvailable(UUID player) {
        if (active(player) != null) throw new IllegalStateException("Finish your current game before starting another.");
    }

    private Invitation invitation(UUID code) {
        Invitation invite = invitations.get(code);
        if (invite == null || invite.expiresAt().isBefore(Instant.now())) throw new NoSuchElementException("Invitation expired or not found.");
        return invite;
    }
}
