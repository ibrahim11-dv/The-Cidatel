package com.chess.server.puzzle.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "puzzle_progress")
public class PuzzleProgressEntity {
    @Id
    private UUID accountId;

    @Lob
    @Column(nullable = false)
    private String progressJson;

    protected PuzzleProgressEntity() {
    }

    PuzzleProgressEntity(UUID accountId, String progressJson) {
        this.accountId = accountId;
        this.progressJson = progressJson;
    }

    void replace(String nextProgressJson) {
        progressJson = nextProgressJson;
    }

    String progressJson() {
        return progressJson;
    }
}
