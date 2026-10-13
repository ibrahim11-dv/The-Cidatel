package com.chess.server.puzzle.application;

import com.chess.server.account.application.AccountService;
import com.chess.server.puzzle.persistence.PuzzleProgressStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class PuzzleProgressService {
    private final AccountService accounts;
    private final PuzzleProgressStore progress;

    public PuzzleProgressService(AccountService accounts, PuzzleProgressStore progress) {
        this.accounts = accounts;
        this.progress = progress;
    }

    @Transactional(readOnly = true)
    public PuzzleProgress current(UUID accountId) {
        accounts.get(accountId);
        return progress.find(accountId).orElseGet(PuzzleProgress::empty);
    }

    public PuzzleProgress save(UUID accountId, PuzzleProgress updated) {
        accounts.get(accountId);
        return progress.save(accountId, updated);
    }
}
