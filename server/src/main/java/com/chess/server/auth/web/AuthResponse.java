package com.chess.server.auth.web;

import com.chess.server.account.web.AccountResponse;

public record AuthResponse(String accessToken, String tokenType, AccountResponse user) {
}
