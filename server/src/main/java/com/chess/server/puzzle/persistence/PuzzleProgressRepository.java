package com.chess.server.puzzle.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

interface PuzzleProgressRepository extends JpaRepository<PuzzleProgressEntity, UUID> {
}
