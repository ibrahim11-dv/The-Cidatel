package com.chess.server.puzzle.application;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;

/** Account-owned learning state. Puzzle positions remain a client-side catalog. */
public record PuzzleProgress(List<String> completed, Stats stats) {
    public PuzzleProgress {
        completed = completed == null ? List.of() : completed.stream()
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new))
                .stream().toList();
        stats = stats == null ? Stats.empty() : stats;
    }

    public static PuzzleProgress empty() {
        return new PuzzleProgress(List.of(), Stats.empty());
    }

    public record Stats(int attempted, int solved, int unassisted, int streak, int best, Attempt active) {
        public Stats {
            if (attempted < 0 || solved < 0 || unassisted < 0 || streak < 0 || best < 0) {
                throw new IllegalArgumentException("Puzzle statistics cannot be negative.");
            }
            if (solved > attempted || unassisted > solved || streak > best || best > unassisted) {
                throw new IllegalArgumentException("Puzzle statistics are inconsistent.");
            }
        }

        public static Stats empty() {
            return new Stats(0, 0, 0, 0, 0, null);
        }
    }

    public record Attempt(String id, boolean failed, boolean solved, boolean revealed) {
        public Attempt {
            if (id == null || id.isBlank() || id.length() > 96) {
                throw new IllegalArgumentException("The active puzzle identifier is invalid.");
            }
            if (solved && revealed) {
                throw new IllegalArgumentException("An attempt cannot be solved and revealed.");
            }
        }
    }
}
