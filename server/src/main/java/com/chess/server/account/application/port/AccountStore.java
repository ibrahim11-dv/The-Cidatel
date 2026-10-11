package com.chess.server.account.application.port;

import com.chess.server.account.domain.UserAccount;

import java.util.Optional;
import java.util.UUID;

public interface AccountStore {

    Optional<UserAccount> findById(UUID id);

    Optional<UserAccount> findByUsername(String username);

    Optional<UserAccount> findByEmail(String email);

    UserAccount save(UserAccount account);
}
