package com.chess.server.game;

import java.util.*;

/** One serialized game aggregate. Player IDs must come from authenticated server identity. */
public final class GameSession {
    public record Result(String score, String reason) {}
    public record Snapshot(UUID id, UUID white, UUID black, String fen, List<String> moves,
                           GameClock.Snapshot clocks, Result result, UUID drawOfferedBy) {}
    public record Accepted(UUID player, int ply, String move) {}
    public record Saved(int version, UUID id, UUID white, UUID black, String initialFen, List<String> moves,
                        GameClock.Saved clock, Result result, UUID drawOfferedBy,
                        Map<UUID, Accepted> accepted, long savedAtMillis) {}

    private final UUID id;
    private final String initialFen;
    private final UUID white;
    private final UUID black;
    private final ChessPosition position;
    private final GameClock clock;
    private final List<String> moves = new ArrayList<>();
    private final Map<UUID, Accepted> accepted = new HashMap<>();
    private Result result;
    private UUID drawOfferedBy;

    int initialSeconds() { return clock.initialSeconds(); }
    int incrementSeconds() { return clock.incrementSeconds(); }

    public GameSession(UUID white, UUID black, int seconds, int increment) {
        this(white, black, new ChessPosition(), new GameClock(seconds, increment));
    }

    GameSession(UUID white, UUID black, ChessPosition position, GameClock clock) {
        this(UUID.randomUUID(), white, black, position, clock, true);
    }

    private GameSession(UUID id, UUID white, UUID black, ChessPosition position, GameClock clock, boolean start) {
        this.id = Objects.requireNonNull(id);
        this.white = Objects.requireNonNull(white);
        this.black = Objects.requireNonNull(black);
        if (white.equals(black)) throw new IllegalArgumentException("Players must be different accounts.");
        this.position = Objects.requireNonNull(position);
        this.initialFen = position.fen();
        this.clock = Objects.requireNonNull(clock);
        if (start) clock.start();
    }

    public synchronized Saved save(long nowMillis) {
        updateTimeout();
        GameClock.Saved savedClock = clock.save();
        updateTimeout(savedClock.expired());
        if (result != null) savedClock = clock.save();
        return new Saved(1, id, white, black, initialFen, List.copyOf(moves), savedClock, result,
                drawOfferedBy, Map.copyOf(accepted), nowMillis);
    }

    public static GameSession restore(Saved saved, long nowMillis) {
        return restore(saved, nowMillis, System::nanoTime);
    }

    static GameSession restore(Saved saved, long nowMillis, java.util.function.LongSupplier nanoTime) {
        if (saved.version() != 1) throw new IllegalArgumentException("Unsupported saved-game version.");
        GameClock clock = GameClock.restore(saved.clock(), Math.max(0, nowMillis - saved.savedAtMillis()), nanoTime);
        GameSession game = new GameSession(saved.id(), saved.white(), saved.black(), new ChessPosition(saved.initialFen()), clock, false);
        for (String move : saved.moves()) game.position.play(move);
        game.moves.addAll(saved.moves());
        game.accepted.putAll(saved.accepted());
        game.result = saved.result();
        game.drawOfferedBy = saved.drawOfferedBy();
        if (game.result == null && saved.clock().running() != null && saved.clock().running() != game.position.turn()) {
            throw new IllegalArgumentException("Saved clock and position disagree.");
        }
        game.updateTimeout();
        return game;
    }

    public synchronized Snapshot snapshot(UUID player) {
        side(player);
        updateTimeout();
        return view();
    }

    public synchronized Snapshot move(UUID player, UUID commandId, int expectedPly, String uci) {
        GameClock.Side mover = side(player);
        Objects.requireNonNull(commandId, "A command ID is required.");
        Accepted command = new Accepted(player, expectedPly, uci);
        Accepted previous = accepted.get(commandId);
        if (previous != null) {
            if (!previous.equals(command)) throw new IllegalArgumentException("Command ID reused with different contents.");
            updateTimeout();
            return view();
        }
        updateTimeout();
        if (result != null) throw new IllegalStateException("Game has ended.");
        if (expectedPly != moves.size()) throw new IllegalStateException("Position changed; refresh the game.");
        if (mover != position.turn()) throw new IllegalStateException("It is not your turn.");
        if (uci == null || !position.legalMoves().contains(uci)) throw new IllegalArgumentException("Illegal chess move.");
        if (!clock.completeMove(mover)) {
            updateTimeout();
            return view();
        }
        position.play(uci);
        if (drawOfferedBy != null && !drawOfferedBy.equals(player)) drawOfferedBy = null;
        moves.add(uci);
        accepted.put(commandId, command);
        if (position.checkmate()) finish(mover == GameClock.Side.WHITE ? "1-0" : "0-1", "checkmate");
        else if (position.stalemate()) finish("1/2-1/2", "stalemate");
        else if (position.insufficientMaterial()) finish("1/2-1/2", "insufficient material");
        else if (position.repetition(5)) finish("1/2-1/2", "fivefold repetition");
        else if (position.halfMoves() >= 150) finish("1/2-1/2", "seventy-five move rule");
        return view();
    }

    public synchronized Snapshot resign(UUID player) {
        GameClock.Side loser = side(player);
        updateTimeout();
        if (result == null) finish(loser == GameClock.Side.WHITE ? "0-1" : "1-0", "resignation");
        return view();
    }

    public synchronized Snapshot offerDraw(UUID player) {
        requireActive(player);
        if (drawOfferedBy != null && !drawOfferedBy.equals(player)) {
            throw new IllegalStateException("Respond to the opponent's existing offer.");
        }
        drawOfferedBy = player;
        return view();
    }

    public synchronized Snapshot respondToDraw(UUID player, boolean accept) {
        requireActive(player);
        if (drawOfferedBy == null || drawOfferedBy.equals(player)) {
            throw new IllegalStateException("There is no opponent draw offer to answer.");
        }
        drawOfferedBy = null;
        if (accept) finish("1/2-1/2", "agreement");
        return view();
    }

    public synchronized Snapshot claimDraw(UUID player, int expectedPly, String intendedMove) {
        requireActive(player);
        if (side(player) != position.turn()) throw new IllegalStateException("Only the player to move may claim.");
        if (expectedPly != moves.size()) throw new IllegalStateException("Position changed; refresh the game.");
        String reason = position.drawClaim(intendedMove);
        if (reason == null) throw new IllegalArgumentException("This position does not support the draw claim.");
        updateTimeout();
        if (result == null) finish("1/2-1/2", reason);
        return view();
    }

    private void requireActive(UUID player) {
        side(player);
        updateTimeout();
        if (result != null) throw new IllegalStateException("Game has ended.");
    }

    private GameClock.Side side(UUID player) {
        if (white.equals(player)) return GameClock.Side.WHITE;
        if (black.equals(player)) return GameClock.Side.BLACK;
        throw new SecurityException("You are not a player in this game.");
    }

    private void updateTimeout() {
        updateTimeout(clock.snapshot().expired());
    }

    private void updateTimeout(GameClock.Side expired) {
        if (result != null) return;
        if (expired == null) return;
        // Basic mating-material cases. More complex dead positions require further adjudication.
        String pieces = position.fen().split(" ")[0];
        String winnerArmy = pieces.replaceAll(expired == GameClock.Side.WHITE ? "[^qrbnp]" : "[^QRBNP]", "");
        String loserArmy = pieces.replaceAll(expired == GameClock.Side.WHITE ? "[^QRBNP]" : "[^qrbnp]", "");
        boolean cannotMate = winnerArmy.isEmpty() || position.insufficientMaterial()
                || (loserArmy.isEmpty() && winnerArmy.matches("[bBnN]"));
        finish(cannotMate ? "1/2-1/2" : expired == GameClock.Side.WHITE ? "0-1" : "1-0", "timeout");
    }

    private void finish(String score, String reason) {
        result = new Result(score, reason);
        drawOfferedBy = null;
        clock.stop();
    }

    private Snapshot view() {
        GameClock.Snapshot clocks = clock.snapshot();
        updateTimeout(clocks.expired());
        return new Snapshot(id, white, black, position.fen(), List.copyOf(moves), clocks, result, drawOfferedBy);
    }
}
