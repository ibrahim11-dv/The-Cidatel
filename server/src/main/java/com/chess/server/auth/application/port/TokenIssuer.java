package com.chess.server.auth.application.port;

import com.chess.server.account.domain.UserAccount;

import java.util.Optional;
import java.util.UUID;

public interface TokenIssuer {

    String issue(UserAccount account);

    Optional<UUID> subjectFrom(String token);
}
