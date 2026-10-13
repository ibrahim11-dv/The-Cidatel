package com.chess.server.puzzle.web;

import com.chess.server.puzzle.application.PuzzleProgressService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/puzzles/progress")
public class PuzzleProgressController {
    private final PuzzleProgressService progress;

    public PuzzleProgressController(PuzzleProgressService progress) {
        this.progress = progress;
    }

    @GetMapping
    public PuzzleProgressResponse current(Authentication authentication) {
        return PuzzleProgressResponse.from(progress.current(accountId(authentication)));
    }

    @PutMapping
    public PuzzleProgressResponse save(Authentication authentication, @Valid @RequestBody PuzzleProgressUpdateRequest request) {
        return PuzzleProgressResponse.from(progress.save(accountId(authentication), request.toDomain()));
    }

    private UUID accountId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
