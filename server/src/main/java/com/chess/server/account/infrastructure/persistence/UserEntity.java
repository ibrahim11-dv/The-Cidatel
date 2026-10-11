package com.chess.server.account.infrastructure.persistence;

import com.chess.server.account.domain.AppearancePreferences;
import com.chess.server.account.domain.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "club_users")
public class UserEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String username;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 20)
    private String boardTheme;

    @Column(nullable = false, length = 20)
    private String pieceStyle;

    @Column(nullable = false, length = 20)
    private String pieceTone;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected UserEntity() {
    }

    private UserEntity(UserAccount account) {
        id = account.id();
        username = account.username();
        email = account.email();
        passwordHash = account.passwordHash();
        boardTheme = account.preferences().boardTheme();
        pieceStyle = account.preferences().pieceStyle();
        pieceTone = account.preferences().pieceTone();
        createdAt = account.createdAt();
    }

    static UserEntity from(UserAccount account) {
        return new UserEntity(account);
    }

    UserAccount toDomain() {
        return new UserAccount(
                id,
                username,
                email,
                passwordHash,
                new AppearancePreferences(boardTheme, pieceStyle, pieceTone),
                createdAt
        );
    }
}
