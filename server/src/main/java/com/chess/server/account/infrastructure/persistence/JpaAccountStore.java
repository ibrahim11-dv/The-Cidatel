package com.chess.server.account.infrastructure.persistence;

import com.chess.server.account.application.port.AccountStore;
import com.chess.server.account.domain.UserAccount;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaAccountStore implements AccountStore {

    private final SpringDataUserRepository users;

    public JpaAccountStore(SpringDataUserRepository users) {
        this.users = users;
    }

    @Override
    public Optional<UserAccount> findById(UUID id) {
        return users.findById(id).map(UserEntity::toDomain);
    }

    @Override
    public Optional<UserAccount> findByUsername(String username) {
        return users.findByUsernameIgnoreCase(username).map(UserEntity::toDomain);
    }

    @Override
    public Optional<UserAccount> findByEmail(String email) {
        return users.findByEmailIgnoreCase(email).map(UserEntity::toDomain);
    }

    @Override
    public UserAccount save(UserAccount account) {
        return users.save(UserEntity.from(account)).toDomain();
    }
}
