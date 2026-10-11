package com.chess.server.account.domain;

import java.util.Set;

public record AppearancePreferences(String boardTheme, String pieceStyle, String pieceTone) {

    private static final Set<String> BOARD_THEMES = Set.of("walnut", "forest", "midnight");
    private static final Set<String> PIECE_STYLES = Set.of("classic", "modern", "manuscript");
    private static final Set<String> PIECE_TONES = Set.of("ivory", "ebony", "brass");

    public AppearancePreferences {
        if (!BOARD_THEMES.contains(boardTheme) || !PIECE_STYLES.contains(pieceStyle) || !PIECE_TONES.contains(pieceTone)) {
            throw new IllegalArgumentException("One or more appearance settings are not supported.");
        }
    }

    public static AppearancePreferences defaults() {
        return new AppearancePreferences("walnut", "classic", "ivory");
    }
}
