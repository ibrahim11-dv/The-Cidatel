package com.chess.server.game.persistence;

import com.chess.server.game.GameSession;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class GameStore {
    private final GameRepository repository;
    private final ObjectMapper json;
    public GameStore(GameRepository repository, ObjectMapper json) { this.repository = repository; this.json = json; }

    @Transactional
    public void save(GameSession.Saved state) {
        String encoded;
        try { encoded = json.writeValueAsString(state); }
        catch (JsonProcessingException error) { throw new IllegalStateException("Could not encode game checkpoint.", error); }
        GameEntity entity = repository.findById(state.id()).orElseGet(() -> new GameEntity(state.id()));
        entity.update(state.white(), state.black(), state.result() != null, state.savedAtMillis(), encoded);
        repository.saveAndFlush(entity);
    }

    @Transactional(readOnly = true)
    public Optional<GameSession.Saved> find(UUID id) { return repository.findById(id).map(this::decode); }

    @Transactional(readOnly = true)
    public List<GameSession.Saved> active() { return repository.findByFinishedFalse().stream().map(this::decode).toList(); }

    private GameSession.Saved decode(GameEntity entity) {
        try { return json.readValue(entity.stateJson(), GameSession.Saved.class); }
        catch (JsonProcessingException error) { throw new IllegalStateException("Could not decode stored game checkpoint.", error); }
    }
}
