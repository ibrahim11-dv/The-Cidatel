package com.chess.server;

import com.chess.server.game.PrivateGames;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import java.nio.file.*;
import java.util.UUID;

/** Child-process fixture: uses the real application and an isolated file database. */
public class RecoveryProcess {
    public record Evidence(UUID white, UUID black, UUID game, UUID command, String fen, long blackMillis) {}
    public static void main(String[] args) throws Exception {
        String phase = args[0];
        Path directory = Path.of(args[1]);
        try (var context = SpringApplication.run(ChessServerApplication.class,
                "--server.port=0", "--spring.main.banner-mode=off", "--logging.level.root=ERROR",
                "--spring.datasource.url=jdbc:h2:file:" + directory.resolve("recovery").toAbsolutePath().toString().replace('\\', '/'),
                "--spring.jpa.hibernate.ddl-auto=update")) {
            var games = context.getBean(PrivateGames.class);
            var json = context.getBean(ObjectMapper.class);
            Path evidencePath = directory.resolve("evidence.json");
            if (phase.equals("create")) {
                UUID white = UUID.randomUUID(), black = UUID.randomUUID(), command = UUID.randomUUID();
                var room = games.create(white, 300, 2);
                var game = games.join(room.code(), black);
                var moved = games.change(game.id(), session -> session.move(white, command, 0, "e2e4"));
                games.change(game.id(), session -> session.offerDraw(white));
                json.writeValue(evidencePath.toFile(), new Evidence(white, black, game.id(), command, moved.fen(), moved.clocks().blackMillis()));
            } else {
                Evidence saved = json.readValue(evidencePath.toFile(), Evidence.class);
                if (phase.equals("resume")) {
                    var state = games.active(saved.black());
                    require(state != null && state.id().equals(saved.game()), "Active game assignment lost");
                    require(state.fen().equals(saved.fen()), "Position lost");
                    require(saved.white().equals(state.drawOfferedBy()), "Draw offer lost");
                    require(state.clocks().blackMillis() < saved.blackMillis(), "Downtime was not deducted");
                    var retry = games.change(saved.game(), session -> session.move(saved.white(), saved.command(), 0, "e2e4"));
                    require(retry.moves().size() == 1, "Duplicate command was replayed");
                    games.change(saved.game(), session -> session.move(saved.black(), UUID.randomUUID(), 1, "e7e5"));
                    games.change(saved.game(), session -> session.resign(saved.white()));
                } else if (phase.equals("finished")) {
                    require(games.active(saved.white()) == null, "Finished game still active");
                    var finished = games.state(saved.game(), saved.black());
                    require(finished.moves().size() == 2, "Completed history lost");
                    require(finished.result().score().equals("0-1"), "Completed result lost");
                    require(finished.clocks().running() == null, "Completed clock resumed");
                } else throw new IllegalArgumentException("Unknown test phase");
            }
        }
    }
    private static void require(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
}
