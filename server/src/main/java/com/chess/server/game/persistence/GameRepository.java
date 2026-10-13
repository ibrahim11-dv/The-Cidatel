package com.chess.server.game.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface GameRepository extends JpaRepository<GameEntity, UUID> {
    List<GameEntity> findByFinishedFalse();

    @Query("select game from GameEntity game where game.finished = true and (game.whitePlayer = :player or game.blackPlayer = :player) order by game.savedAtMillis desc")
    List<GameEntity> findFinishedByPlayer(@Param("player") UUID player, Pageable page);
}
