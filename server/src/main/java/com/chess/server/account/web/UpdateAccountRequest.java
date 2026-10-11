package com.chess.server.account.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateAccountRequest(
        @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_]{3,20}$", message = "Use 3–20 letters, numbers, or underscores for your username.") String username,
        @NotBlank @Email(message = "Enter a valid email address.") String email
) {
}
