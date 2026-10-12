package com.chess.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.TestPropertySource;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:game-http-tests;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class GameHttpIntegrationTest {
    @LocalServerPort int port;
    @Autowired ObjectMapper json;
    private record Player(HttpClient client, String token) {}

    private JsonNode call(Player player, String method, String path, Object body, int expected) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(java.time.Duration.ofSeconds(10)).header("Content-Type", "application/json");
        if (player.token() != null) request.header("Authorization", "Bearer " + player.token());
        request.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        HttpResponse<String> response = player.client().send(request.build(), HttpResponse.BodyHandlers.ofString());
        assertEquals(expected, response.statusCode(), method + " " + path);
        return response.body().isBlank() ? json.nullNode() : json.readTree(response.body());
    }

    private Player register() throws Exception {
        String name = "test_" + UUID.randomUUID().toString().substring(0, 8);
        Player anonymous = new Player(HttpClient.newHttpClient(), null);
        JsonNode response = call(anonymous, "POST", "/api/auth/register", Map.of(
                "username", name, "email", name + "@example.test", "password", "SafePassword9"), 201);
        return new Player(anonymous.client(), response.get("accessToken").asText());
    }

    @Test void matchmakingPairsSeparateAccountsAndCancellationRemovesWaitingEntry() throws Exception {
        Player first = register(), second = register();
        Map<String, Integer> control = Map.of("seconds", 180, "increment", 2);
        assertTrue(call(first, "POST", "/api/games/matchmaking", control, 200).get("waiting").asBoolean());
        call(first, "DELETE", "/api/games/matchmaking", null, 200);
        assertTrue(call(second, "POST", "/api/games/matchmaking", control, 200).get("waiting").asBoolean());
        JsonNode matched = call(first, "POST", "/api/games/matchmaking", control, 200);
        assertFalse(matched.get("waiting").asBoolean());
        assertEquals(matched.get("gameId"), call(second, "POST", "/api/games/matchmaking", control, 200).get("gameId"));
        assertEquals(matched.get("gameId"), call(second, "DELETE", "/api/games/matchmaking", null, 200).get("gameId"));
        assertEquals(matched.get("gameId"), call(first, "GET", "/api/games/active", null, 200).get("id"));
    }

    @Test void rematchConsentOverHttpCreatesOneGameWithReversedColors() throws Exception {
        Player first = register(), second = register();
        JsonNode invite = call(first, "POST", "/api/games/invitations", Map.of("seconds", 60, "increment", 1), 200);
        JsonNode original = call(second, "POST", "/api/games/invitations/" + invite.get("code").asText() + "/join", null, 200);
        String path = "/api/games/" + original.get("id").asText();
        call(second, "POST", path + "/resign", null, 200);
        assertTrue(call(first, "POST", path + "/rematch", null, 200).get("gameId").isNull());
        assertEquals(original.get("white"), call(second, "GET", path + "/rematch", null, 200).get("requestedBy"));
        JsonNode agreed = call(second, "POST", path + "/rematch", null, 200);
        assertEquals(agreed, call(second, "POST", path + "/rematch", null, 200));
        JsonNode next = call(first, "GET", "/api/games/" + agreed.get("gameId").asText(), null, 200);
        assertEquals(original.get("black"), next.get("white"));
        assertEquals(original.get("white"), next.get("black"));
        assertEquals(0, next.get("moves").size());
        assertTrue(next.get("result").isNull());
    }

    @Test void intendedDrawClaimOverHttpRetainsTheUnplayedMove() throws Exception {
        Player white = register(), black = register();
        JsonNode invite = call(white, "POST", "/api/games/invitations", Map.of("seconds", 60, "increment", 0), 200);
        JsonNode joined = call(black, "POST", "/api/games/invitations/" + invite.get("code").asText() + "/join", null, 200);
        String path = "/api/games/" + joined.get("id").asText();
        String[] sequence = {"g1f3", "g8f6", "f3g1", "f6g8", "g1f3", "g8f6", "f3g1"};
        JsonNode state = joined;
        for (int i = 0; i < sequence.length; i++) state = call(i % 2 == 0 ? white : black, "POST", path + "/moves", Map.of("commandId", UUID.randomUUID(), "expectedPly", i, "move", sequence[i]), 200);
        Map<String, Object> claim = Map.of("expectedPly", 7, "intendedMove", "f6g8");
        call(white, "POST", path + "/draw/claim", claim, 409);
        JsonNode ended = call(black, "POST", path + "/draw/claim", claim, 200);
        assertEquals(state.get("fen"), ended.get("fen"));
        assertEquals(7, ended.get("moves").size());
        assertEquals("threefold repetition", ended.at("/result/reason").asText());
    }

    @Test void independentAuthenticatedClientsShareOnlyServerAcceptedMovesAndResults() throws Exception {
        Player host = register(), guest = register(), outsider = register();
        call(new Player(HttpClient.newHttpClient(), null), "POST", "/api/games/invitations",
                Map.of("seconds", 60, "increment", 1), 401);
        JsonNode invite = call(host, "POST", "/api/games/invitations", Map.of("seconds", 60, "increment", 1), 200);
        String room = "/api/games/invitations/" + invite.get("code").asText();
        call(host, "POST", room + "/join", null, 400);
        JsonNode joined = call(guest, "POST", room + "/join", null, 200);
        String game = "/api/games/" + joined.get("id").asText();
        call(outsider, "GET", game, null, 403);
        call(outsider, "GET", game + "/players", null, 403);
        JsonNode names = call(host, "GET", game + "/players", null, 200);
        assertEquals(2, names.size());
        assertTrue(names.get("white").asText().startsWith("test_"));
        assertTrue(names.get("black").asText().startsWith("test_"));
        assertEquals(names, call(guest, "GET", game + "/players", null, 200));
        call(outsider, "POST", room + "/join", null, 403);
        call(guest, "POST", game + "/moves", Map.of("commandId", UUID.randomUUID(), "expectedPly", 0, "move", "e7e5"), 409);
        call(host, "POST", game + "/moves", Map.of("commandId", UUID.randomUUID(), "expectedPly", 0, "move", "e2e5"), 400);
        Map<String, Object> first = Map.of("commandId", UUID.randomUUID(), "expectedPly", 0, "move", "e2e4");
        JsonNode moved = call(host, "POST", game + "/moves", first, 200);
        assertEquals(1, call(host, "POST", game + "/moves", first, 200).get("moves").size());
        JsonNode observed = call(guest, "GET", game, null, 200);
        assertEquals(moved.get("fen"), observed.get("fen"));
        assertEquals("BLACK", observed.at("/clocks/running").asText());
        assertTrue(observed.at("/clocks/whiteMillis").asLong() <= 61_000);
        call(guest, "POST", game + "/moves", Map.of("commandId", UUID.randomUUID(), "expectedPly", 0, "move", "e7e5"), 409);
        call(guest, "POST", game + "/moves", Map.of("commandId", UUID.randomUUID(), "expectedPly", 1, "move", "e7e5"), 200);
        Player reconnected = new Player(HttpClient.newHttpClient(), host.token());
        assertEquals(2, call(reconnected, "GET", game, null, 200).get("moves").size());
        JsonNode ended = call(guest, "POST", game + "/resign", null, 200);
        assertEquals("1-0", ended.at("/result/score").asText());
        JsonNode finalState = call(reconnected, "GET", game, null, 200);
        assertEquals(ended.get("result"), finalState.get("result"));
        assertEquals(ended.get("clocks"), finalState.get("clocks"));
    }

    @Test void drawAgreementRequiresTheOpponentsAuthenticatedConsent() throws Exception {
        Player host = register(), guest = register(), outsider = register();
        JsonNode invite = call(host, "POST", "/api/games/invitations", Map.of("seconds", 60, "increment", 0), 200);
        JsonNode joined = call(guest, "POST", "/api/games/invitations/" + invite.get("code").asText() + "/join", null, 200);
        String game = "/api/games/" + joined.get("id").asText();
        call(host, "POST", game + "/draw/offer", null, 200);
        assertEquals(joined.get("white"), call(guest, "GET", game, null, 200).get("drawOfferedBy"));
        call(host, "POST", game + "/draw/accept", null, 409);
        call(outsider, "POST", game + "/draw/accept", null, 403);
        assertTrue(call(guest, "POST", game + "/draw/decline", null, 200).get("drawOfferedBy").isNull());
        call(guest, "POST", game + "/draw/offer", null, 200);
        JsonNode ended = call(host, "POST", game + "/draw/accept", null, 200);
        assertEquals("1/2-1/2", ended.at("/result/score").asText());
        assertEquals("agreement", ended.at("/result/reason").asText());
        assertTrue(ended.at("/clocks/running").isNull());
        assertEquals(ended.get("result"), call(guest, "GET", game, null, 200).get("result"));
    }
}
