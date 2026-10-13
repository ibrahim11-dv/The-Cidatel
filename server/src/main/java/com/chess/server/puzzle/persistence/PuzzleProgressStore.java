package com.chess.server.puzzle.persistence;

import com.chess.server.puzzle.application.PuzzleProgress;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public class PuzzleProgressStore {
    private final PuzzleProgressRepository repository;
    private final ObjectMapper json;

    public PuzzleProgressStore(PuzzleProgressRepository repository, ObjectMapper json) {
        this.repository = repository;
        this.json = json;
    }

    @Transactional(readOnly = true)
    public Optional<PuzzleProgress> find(UUID accountId) {
        return repository.findById(accountId).map(this::decode);
    }

    @Transactional
    public PuzzleProgress save(UUID accountId, PuzzleProgress progress) {
        String encoded = encode(progress);
        PuzzleProgressEntity entity = repository.findById(accountId)
                .orElseGet(() -> new PuzzleProgressEntity(accountId, encoded));
        entity.replace(encoded);
        repository.saveAndFlush(entity);
        return progress;
    }

    private String encode(PuzzleProgress progress) {
        try {
            return json.writeValueAsString(progress);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Could not save puzzle progress.", error);
        }
    }

    private PuzzleProgress decode(PuzzleProgressEntity entity) {
        try {
            return json.readValue(entity.progressJson(), PuzzleProgress.class);
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("Could not restore puzzle progress.", error);
        }
    }
}
