package com.chess.server.account.web;

import com.chess.server.account.application.AccountService;
import com.chess.server.account.domain.AppearancePreferences;
import com.chess.server.account.domain.UserAccount;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/account/me")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public AccountResponse current(Authentication authentication) {
        return AccountResponse.from(accountService.get(accountId(authentication)));
    }

    @PutMapping
    public AccountResponse updateIdentity(Authentication authentication, @Valid @RequestBody UpdateAccountRequest request) {
        UserAccount account = accountService.updateIdentity(accountId(authentication), request.username(), request.email());
        return AccountResponse.from(account);
    }

    @PutMapping("/password")
    public AccountResponse updatePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        UserAccount account = accountService.updatePassword(accountId(authentication), request.currentPassword(), request.newPassword());
        return AccountResponse.from(account);
    }

    @PutMapping("/appearance")
    public AccountResponse updateAppearance(Authentication authentication, @Valid @RequestBody UpdateAppearanceRequest request) {
        AppearancePreferences preferences = new AppearancePreferences(request.boardTheme(), request.pieceStyle(), request.pieceTone(), request.customColors());
        UserAccount account = accountService.updatePreferences(accountId(authentication), preferences);
        return AccountResponse.from(account);
    }

    private UUID accountId(Authentication authentication) {
        return (UUID) authentication.getPrincipal();
    }
}
