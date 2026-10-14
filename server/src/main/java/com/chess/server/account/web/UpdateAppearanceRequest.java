package com.chess.server.account.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import java.util.Map;

public record UpdateAppearanceRequest(
        @NotBlank @Pattern(regexp = "walnut|forest|midnight") String boardTheme,
        @NotBlank @Pattern(regexp = "classic|modern|manuscript") String pieceStyle,
        @NotBlank @Pattern(regexp = "ivory|ebony|brass") String pieceTone,
        @Pattern(regexp = "walnut|oak|mahogany|forest|midnight|ivory") String siteTheme,
        Map<String, String> customColors,
        Boolean coordinates,
        Boolean legalMoves,
        Boolean sound,
        @Min(0) @Max(240) Integer animationMs,
        @Pattern(regexp = "white|black") String orientation
) {
}
