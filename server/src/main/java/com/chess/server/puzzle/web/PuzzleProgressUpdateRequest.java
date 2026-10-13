package com.chess.server.puzzle.web;

import com.chess.server.puzzle.application.PuzzleProgress;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PuzzleProgressUpdateRequest(
        @NotNull @Size(max = 5000) List<@NotBlank @Pattern(regexp = "[A-Za-z0-9-]{1,96}") String> completed,
        @NotNull @Valid Stats stats
) {
    public PuzzleProgress toDomain() {
        return new PuzzleProgress(completed, stats.toDomain());
    }

    public record Stats(
            @Min(0) @Max(1_000_000_000) int attempted,
            @Min(0) @Max(1_000_000_000) int solved,
            @Min(0) @Max(1_000_000_000) int unassisted,
            @Min(0) @Max(1_000_000_000) int streak,
            @Min(0) @Max(1_000_000_000) int best,
            @Valid Attempt active
    ) {
        PuzzleProgress.Stats toDomain() {
            return new PuzzleProgress.Stats(attempted, solved, unassisted, streak, best,
                    active == null ? null : active.toDomain());
        }
    }

    public record Attempt(
            @NotBlank @Pattern(regexp = "[A-Za-z0-9-]{1,96}") String id,
            boolean failed,
            boolean solved,
            boolean revealed
    ) {
        PuzzleProgress.Attempt toDomain() {
            return new PuzzleProgress.Attempt(id, failed, solved, revealed);
        }
    }
}
