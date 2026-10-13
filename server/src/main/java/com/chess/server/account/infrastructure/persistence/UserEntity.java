package com.chess.server.account.infrastructure.persistence;

import com.chess.server.account.domain.AppearancePreferences;
import com.chess.server.account.domain.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;
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

    // Nullable keeps existing installed accounts compatible with this additive schema update.
    @Column(length = 20)
    private String siteTheme;

    // Nullable keeps existing installed accounts compatible with this additive schema update.
    @Column(length = 512)
    private String customColors;

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
        siteTheme = account.preferences().siteTheme();
        customColors = encodeColors(account.preferences().customColors());
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
                new AppearancePreferences(boardTheme, pieceStyle, pieceTone,
                        siteTheme == null || siteTheme.isBlank() ? "walnut" : siteTheme, decodeColors(customColors)),
                createdAt
        );
    }

    private static String encodeColors(Map<String, String> colors) {
        return new TreeMap<>(colors).entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .reduce((left, right) -> left + ";" + right)
                .orElse("");
    }

    private static Map<String, String> decodeColors(String stored) {
        if (stored == null || stored.isBlank()) return Map.of();
        Map<String, String> colors = new TreeMap<>();
        for (String entry : stored.split(";")) {
            String[] pair = entry.split("=", 2);
            if (pair.length != 2) throw new IllegalStateException("Stored appearance colors are invalid.");
            colors.put(pair[0], pair[1]);
        }
        return colors;
    }
}
