package com.chess.server.auth.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_]{3,20}$", message = "Use 3–20 letters, numbers, or underscores for your username.") String username,
        @NotBlank @Email(message = "Enter a valid email address.") String email,
        @NotBlank @Size(min = 8, max = 72, message = "Use 8–72 characters for your password.") String password
) {
}
