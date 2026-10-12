package com.chess.server.game.persistence;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "online_games")
public class GameEntity {
    @Id private UUID id;
    @Version private Long revision;
    @Column(nullable = false) private UUID whitePlayer;
    @Column(nullable = false) private UUID blackPlayer;
    @Column(nullable = false) private boolean finished;
    @Column(nullable = false) private long savedAtMillis;
    @Lob @Column(nullable = false) private String stateJson;

    protected GameEntity() {}
    GameEntity(UUID id) { this.id = id; }
    void update(UUID white, UUID black, boolean finished, long savedAt, String json) {
        if (stateJson != null && savedAt < savedAtMillis) throw new IllegalStateException("Refusing an older game checkpoint.");
        whitePlayer = white;
        blackPlayer = black;
        this.finished = finished;
        savedAtMillis = savedAt;
        stateJson = json;
    }
    String stateJson() { return stateJson; }
}
