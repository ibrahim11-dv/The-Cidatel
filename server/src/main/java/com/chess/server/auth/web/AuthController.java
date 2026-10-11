package com.chess.server.auth.web;

import com.chess.server.account.application.AccountService;
import com.chess.server.account.domain.UserAccount;
import com.chess.server.account.web.AccountResponse;
import com.chess.server.auth.application.AuthService;
import com.chess.server.auth.application.port.TokenIssuer;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AccountService accountService;
    private final AuthService authService;
    private final TokenIssuer tokenIssuer;

    public AuthController(AccountService accountService, AuthService authService, TokenIssuer tokenIssuer) {
        this.accountService = accountService;
        this.authService = authService;
        this.tokenIssuer = tokenIssuer;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        UserAccount account = accountService.register(request.username(), request.email(), request.password());
        return new AuthResponse(tokenIssuer.issue(account), "Bearer", AccountResponse.from(account));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthenticatedAccount authenticated = authService.login(request.identifier(), request.password());
        return new AuthResponse(authenticated.accessToken(), "Bearer", AccountResponse.from(authenticated.account()));
    }
}
