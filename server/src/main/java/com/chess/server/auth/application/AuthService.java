package com.chess.server.auth.application;

import com.chess.server.account.application.InvalidCredentialsException;
import com.chess.server.account.application.port.AccountStore;
import com.chess.server.account.application.port.PasswordHasher;
import com.chess.server.account.domain.UserAccount;
import com.chess.server.auth.application.port.TokenIssuer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final AccountStore accountStore;
    private final PasswordHasher passwordHasher;
    private final TokenIssuer tokenIssuer;

    public AuthService(AccountStore accountStore, PasswordHasher passwordHasher, TokenIssuer tokenIssuer) {
        this.accountStore = accountStore;
        this.passwordHasher = passwordHasher;
        this.tokenIssuer = tokenIssuer;
    }

    public AuthenticatedAccount login(String identifier, String password) {
        String cleanIdentifier = identifier.trim();
        UserAccount account = accountStore.findByUsername(cleanIdentifier)
                .or(() -> accountStore.findByEmail(cleanIdentifier.toLowerCase(Locale.ROOT)))
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordHasher.matches(password, account.passwordHash())) {
            throw new InvalidCredentialsException();
        }
        return new AuthenticatedAccount(account, tokenIssuer.issue(account));
    }

    public record AuthenticatedAccount(UserAccount account, String accessToken) {
    }
}
