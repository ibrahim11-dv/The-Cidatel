package com.chess.server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.datasource.url=jdbc:h2:mem:error-dispatch;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Import(ErrorDispatchIntegrationTest.Fixtures.class)
class ErrorDispatchIntegrationTest {
    @LocalServerPort int port;
    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void unexpectedFailureKeepsServerStatusInsteadOfBecomingAuthenticationFailure() throws Exception {
        var response = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/auth/test-failure"))
                .header("Accept", "application/json").POST(HttpRequest.BodyPublishers.noBody()).build(),
                HttpResponse.BodyHandlers.ofString());
        assertEquals(500, response.statusCode());
        assertFalse(response.body().contains("Authentication is required"));
        assertFalse(response.body().contains("private database details"));
    }

    @Test
    void directErrorAndProtectedRequestsStillRequireAuthentication() throws Exception {
        for (String path : new String[]{"/error", "/api/account/me", "/api/games/lobby"}) {
            var response = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                    .GET().build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(401, response.statusCode(), path);
        }
    }

    @TestConfiguration
    static class Fixtures {
        @Bean FailureController failureController() { return new FailureController(); }
    }

    @RestController
    static class FailureController {
        @PostMapping("/api/auth/test-failure")
        void fail() { throw new NullPointerException("private database details"); }
    }
}
