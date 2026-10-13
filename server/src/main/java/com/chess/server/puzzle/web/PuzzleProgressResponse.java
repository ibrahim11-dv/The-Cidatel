package com.chess.server.puzzle.web;

import com.chess.server.puzzle.application.PuzzleProgress;

import java.util.List;

public record PuzzleProgressResponse(List<String> completed, Stats stats) {
    static PuzzleProgressResponse from(PuzzleProgress progress) {
        return new PuzzleProgressResponse(progress.completed(), Stats.from(progress.stats()));
    }

    public record Stats(int attempted, int solved, int unassisted, int streak, int best, Attempt active) {
        static Stats from(PuzzleProgress.Stats stats) {
            return new Stats(stats.attempted(), stats.solved(), stats.unassisted(), stats.streak(), stats.best(),
                    stats.active() == null ? null : Attempt.from(stats.active()));
        }
    }

    public record Attempt(String id, boolean failed, boolean solved, boolean revealed) {
        static Attempt from(PuzzleProgress.Attempt attempt) {
            return new Attempt(attempt.id(), attempt.failed(), attempt.solved(), attempt.revealed());
        }
    }
}
