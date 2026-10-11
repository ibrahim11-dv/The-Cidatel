package com.chess.server.account.application;

public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("The username/email or password is incorrect.");
    }
}
