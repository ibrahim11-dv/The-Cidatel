package com.chess.server.account.application;

import com.chess.server.account.application.port.AccountStore;
import com.chess.server.account.application.port.PasswordHasher;
import com.chess.server.account.domain.AppearancePreferences;
import com.chess.server.account.domain.UserAccount;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class AccountService {

    private final AccountStore accountStore;
    private final PasswordHasher passwordHasher;

    public AccountService(AccountStore accountStore, PasswordHasher passwordHasher) {
        this.accountStore = accountStore;
        this.passwordHasher = passwordHasher;
    }

    @Transactional(readOnly = true)
    public UserAccount get(UUID accountId) {
        return accountStore.findById(accountId).orElseThrow(AccountNotFoundException::new);
    }

    public UserAccount register(String username, String email, String password) {
        String cleanUsername = username.trim();
        String cleanEmail = normalizeEmail(email);
        ensureUnique(cleanUsername, cleanEmail, null);
        return accountStore.save(UserAccount.create(cleanUsername, cleanEmail, passwordHasher.hash(password)));
    }

    public UserAccount updateIdentity(UUID accountId, String username, String email) {
        String cleanUsername = username.trim();
        String cleanEmail = normalizeEmail(email);
        ensureUnique(cleanUsername, cleanEmail, accountId);
        return accountStore.save(get(accountId).withIdentity(cleanUsername, cleanEmail));
    }

    public UserAccount updatePassword(UUID accountId, String currentPassword, String newPassword) {
        UserAccount account = get(accountId);
        if (!passwordHasher.matches(currentPassword, account.passwordHash())) {
            throw new InvalidCredentialsException();
        }
        return accountStore.save(account.withPasswordHash(passwordHasher.hash(newPassword)));
    }

    public UserAccount updatePreferences(UUID accountId, AppearancePreferences preferences) {
        return accountStore.save(get(accountId).withPreferences(preferences));
    }

    private void ensureUnique(String username, String email, UUID excludedAccountId) {
        accountStore.findByUsername(username)
                .filter(account -> !account.id().equals(excludedAccountId))
                .ifPresent(account -> {
                    throw new AccountConflictException("That username is already in use.");
                });
        accountStore.findByEmail(email)
                .filter(account -> !account.id().equals(excludedAccountId))
                .ifPresent(account -> {
                    throw new AccountConflictException("That email is already in use.");
                });
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
