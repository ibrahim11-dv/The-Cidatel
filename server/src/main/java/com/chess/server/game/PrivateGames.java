package com.chess.server.game;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import com.chess.server.game.persistence.GameStore;
import org.springframework.beans.factory.annotation.Autowired;

/** Single-process game registry backed by durable checkpoints. Waiting rooms remain transient. */
@Service
public class PrivateGames {
    public record Invitation(UUID code, UUID host, int seconds, int increment, Instant expiresAt, UUID gameId) {}
    public record Lobby(GameSession.Snapshot game, Invitation invitation) {}
    public synchronized Lobby lobby(UUID player) {
        var game = active(player);
        if (game != null) return new Lobby(game, null);
        Instant now = Instant.now();
        var waiting = invitations.values().stream().filter(invite -> invite.host().equals(player)
                && invite.gameId() == null && invite.expiresAt().isAfter(now)).findFirst().orElse(null);
        return new Lobby(null, waiting);
    }
    private final Map<UUID, Invitation> invitations = new HashMap<>();
    private final Map<UUID, GameSession> games = new HashMap<>();
    private final Map<UUID, UUID> activeByPlayer = new HashMap<>();
    private GameStore store;
    private final Set<UUID> persistedFinished = new HashSet<>();
    private final Map<UUID, Long> finishedSince = new HashMap<>();

    @Autowired
    public PrivateGames(GameStore store) {
        this(store, System::nanoTime);
    }

    PrivateGames(GameStore store, java.util.function.LongSupplier monotonic) {
        this(monotonic);
        this.store = store;
        long now = System.currentTimeMillis();
        for (GameSession.Saved saved : store.active()) {
            GameSession game = GameSession.restore(saved, now);
            games.put(saved.id(), game);
            var state = game.snapshot(saved.white());
            if (state.result() == null) {
                if (activeByPlayer.putIfAbsent(saved.white(), saved.id()) != null
                        || activeByPlayer.putIfAbsent(saved.black(), saved.id()) != null) {
                    throw new IllegalStateException("Conflicting stored active games.");
                }
            } else persist(game);
        }
    }

    private void persist(GameSession game) {
        if (store == null) return;
        var saved = game.save(System.currentTimeMillis());
        store.save(saved);
        if (saved.result() != null) {
            persistedFinished.add(saved.id());
            finishedSince.putIfAbsent(saved.id(), monotonic.getAsLong());
            activeByPlayer.remove(saved.white(), saved.id());
            activeByPlayer.remove(saved.black(), saved.id());
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 1000, initialDelay = 1000)
    public synchronized void maintain() {
        long now = monotonic.getAsLong();
        Instant wallTime = Instant.now();
        queue.values().removeIf(entry -> now - entry.seenAt() >= 30_000_000_000L);
        invitations.values().removeIf(invite -> !invite.expiresAt().isAfter(wallTime));
        for (var entry : games.entrySet()) {
            if (persistedFinished.contains(entry.getKey())) continue;
            var saved = entry.getValue().save(System.currentTimeMillis());
            if (saved.result() != null) {
                persist(entry.getValue());
                activeByPlayer.remove(saved.white(), saved.id());
                activeByPlayer.remove(saved.black(), saved.id());
            }
        }
        // Keep a fifteen-minute rematch window; durable completed records remain queryable.
        var expired = finishedSince.entrySet().stream()
                .filter(entry -> now - entry.getValue() >= 900_000_000_000L)
                .map(Map.Entry::getKey).toList();
        for (UUID id : expired) {
            games.remove(id);
            persistedFinished.remove(id);
            finishedSince.remove(id);
            rematches.remove(id);
        }
    }

    public synchronized GameSession.Snapshot state(UUID id, UUID player) {
        GameSession game = get(id);
        var state = game.snapshot(player);
        if (state.result() != null && !persistedFinished.contains(id)) persist(game);
        return state;
    }

    public synchronized GameSession.Snapshot change(UUID id, java.util.function.Function<GameSession, GameSession.Snapshot> operation) {
        GameSession game = get(id);
        var before = game.save(System.currentTimeMillis());
        try {
            GameSession.Snapshot result = operation.apply(game);
            persist(game);
            return result;
        }
        catch (RuntimeException failure) {
            games.put(id, GameSession.restore(before, System.currentTimeMillis()));
            throw failure;
        }
    }
    public record Rematch(UUID requestedBy, UUID gameId) {}
    private final Map<UUID, Rematch> rematches = new HashMap<>();

    public synchronized Rematch rematchStatus(UUID id, UUID player) {
        state(id, player);
        return rematches.getOrDefault(id, new Rematch(null, null));
    }

    public synchronized Rematch requestRematch(UUID id, UUID player) {
        GameSession old = get(id);
        GameSession.Snapshot previous = state(id, player);
        if (previous.result() == null) throw new IllegalStateException("Finish the game before requesting a rematch.");
        Rematch existing = rematches.get(id);
        if (existing != null && existing.gameId() != null) return existing;
        requireAvailable(previous.white());
        requireAvailable(previous.black());
        if (existing == null || existing.requestedBy().equals(player)) {
            Rematch requested = new Rematch(player, null);
            rematches.put(id, requested);
            return requested;
        }
        GameSession next = new GameSession(previous.black(), previous.white(), old.initialSeconds(), old.incrementSeconds());
        GameSession.Snapshot state = next.snapshot(player);
        persist(next);
        games.put(state.id(), next);
        activeByPlayer.put(state.white(), state.id());
        activeByPlayer.put(state.black(), state.id());
        queue.remove(state.white());
        queue.remove(state.black());
        invitations.values().removeIf(invite -> invite.gameId() == null
                && (invite.host().equals(state.white()) || invite.host().equals(state.black())));
        Rematch matched = new Rematch(existing.requestedBy(), state.id());
        rematches.put(id, matched);
        return matched;
    }

    public synchronized Rematch cancelRematch(UUID id, UUID player) {
        Rematch state = rematchStatus(id, player);
        if (state.gameId() == null) rematches.remove(id);
        return state.gameId() == null ? new Rematch(null, null) : state;
    }
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
        persist(game);
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
        if (invite.gameId() != null) return state(invite.gameId(), player);
        requireAvailable(invite.host());
        requireAvailable(player);
        GameSession game = new GameSession(invite.host(), player, invite.seconds(), invite.increment());
        GameSession.Snapshot snapshot = game.snapshot(player);
        persist(game);
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
        if (game == null && store != null) {
            var saved = store.find(id);
            if (saved.isPresent()) {
                game = GameSession.restore(saved.get(), System.currentTimeMillis());
                games.put(id, game);
                if (saved.get().result() != null) {
                    persistedFinished.add(id);
                    finishedSince.putIfAbsent(id, monotonic.getAsLong());
                }
            }
        }
        if (game == null) throw new NoSuchElementException("Game not found.");
        return game;
    }

    public synchronized GameSession.Snapshot active(UUID player) {
        UUID id = activeByPlayer.get(player);
        if (id == null) return null;
        GameSession.Snapshot state = state(id, player);
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
