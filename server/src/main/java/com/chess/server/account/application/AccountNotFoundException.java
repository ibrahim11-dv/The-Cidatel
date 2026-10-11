package com.chess.server.account.application;

public class AccountNotFoundException extends RuntimeException {

    public AccountNotFoundException() {
        super("The requested account was not found.");
    }
}
