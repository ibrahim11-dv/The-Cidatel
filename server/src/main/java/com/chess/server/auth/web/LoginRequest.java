package com.chess.server.auth.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Enter your username or email.") String identifier,
        @NotBlank @Size(max = 72) String password
) {
}
