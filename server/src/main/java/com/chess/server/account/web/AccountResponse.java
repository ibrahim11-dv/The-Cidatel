package com.chess.server.account.web;

import com.chess.server.account.domain.AppearancePreferences;
import com.chess.server.account.domain.UserAccount;

import java.util.UUID;

public record AccountResponse(UUID id, String username, String email, AppearancePreferences preferences) {

    public static AccountResponse from(UserAccount account) {
        return new AccountResponse(account.id(), account.username(), account.email(), account.preferences());
    }
}
