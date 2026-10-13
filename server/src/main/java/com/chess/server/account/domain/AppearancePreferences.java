package com.chess.server.account.domain;

import java.util.Map;
import java.util.Set;

public record AppearancePreferences(String boardTheme, String pieceStyle, String pieceTone, Map<String, String> customColors) {

    private static final Set<String> BOARD_THEMES = Set.of("walnut", "forest", "midnight");
    private static final Set<String> PIECE_STYLES = Set.of("classic", "modern", "manuscript");
    private static final Set<String> PIECE_TONES = Set.of("ivory", "ebony", "brass");
    private static final Set<String> COLOR_TOKENS = Set.of(
            "--paper", "--sidebar", "--paper-light", "--ink", "--brass", "--button",
            "--wood-light", "--wood-dark", "--selected", "--legal", "--last-move");

    public AppearancePreferences {
        customColors = customColors == null ? Map.of() : Map.copyOf(customColors);
        if (!BOARD_THEMES.contains(boardTheme) || !PIECE_STYLES.contains(pieceStyle) || !PIECE_TONES.contains(pieceTone)) {
            throw new IllegalArgumentException("One or more appearance settings are not supported.");
        }
        if (customColors.size() > COLOR_TOKENS.size() || customColors.entrySet().stream()
                .anyMatch(entry -> !COLOR_TOKENS.contains(entry.getKey()) || !entry.getValue().matches("#[0-9a-fA-F]{6}"))) {
            throw new IllegalArgumentException("One or more custom colors are not supported.");
        }
    }

    public static AppearancePreferences defaults() {
        return new AppearancePreferences("walnut", "classic", "ivory", Map.of());
    }
}
