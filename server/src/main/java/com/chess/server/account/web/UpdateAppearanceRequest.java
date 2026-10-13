package com.chess.server.account.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.Map;

public record UpdateAppearanceRequest(
        @NotBlank @Pattern(regexp = "walnut|forest|midnight") String boardTheme,
        @NotBlank @Pattern(regexp = "classic|modern|manuscript") String pieceStyle,
        @NotBlank @Pattern(regexp = "ivory|ebony|brass") String pieceTone,
        Map<String, String> customColors
) {
}
