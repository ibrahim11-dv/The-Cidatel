package com.chess.server.account.domain;

import java.time.Instant;
import java.util.UUID;

public record UserAccount(
        UUID id,
        String username,
        String email,
        String passwordHash,
        AppearancePreferences preferences,
        Instant createdAt
) {

    public static UserAccount create(String username, String email, String passwordHash) {
        return new UserAccount(UUID.randomUUID(), username, email, passwordHash, AppearancePreferences.defaults(), Instant.now());
    }

    public UserAccount withIdentity(String updatedUsername, String updatedEmail) {
        return new UserAccount(id, updatedUsername, updatedEmail, passwordHash, preferences, createdAt);
    }

    public UserAccount withPasswordHash(String updatedPasswordHash) {
        return new UserAccount(id, username, email, updatedPasswordHash, preferences, createdAt);
    }

    public UserAccount withPreferences(AppearancePreferences updatedPreferences) {
        return new UserAccount(id, username, email, passwordHash, updatedPreferences, createdAt);
    }
}
