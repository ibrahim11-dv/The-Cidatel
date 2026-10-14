package com.chess.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:walnut-chess-tests;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class AuthApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registrationLoginAndAccountChangesRequireAndAcceptJwtAuthentication() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "member_" + suffix;
        String email = username + "@example.test";
        String password = "QuietTable9";

        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","email":"%s","password":"%s"}
                                """.formatted(username, email, password)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.username").value(username))
                .andReturn();

        JsonNode response = objectMapper.readTree(registration.getResponse().getContentAsString());
        String token = response.path("accessToken").asText();

        mockMvc.perform(get("/api/account/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/account/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.preferences.boardTheme").value("walnut"));

        mockMvc.perform(put("/api/account/me/appearance")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"boardTheme":"forest","pieceStyle":"modern","pieceTone":"brass","siteTheme":"mahogany","customColors":{"--paper":"#112233","--legal":"#445566"},"coordinates":false,"legalMoves":false,"sound":true,"animationMs":240,"orientation":"black"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferences.boardTheme").value("forest"))
                .andExpect(jsonPath("$.preferences.siteTheme").value("mahogany"))
                .andExpect(jsonPath("$.preferences.pieceStyle").value("modern"))
                .andExpect(jsonPath("$.preferences.customColors['--paper']").value("#112233"))
                .andExpect(jsonPath("$.preferences.coordinates").value(false))
                .andExpect(jsonPath("$.preferences.legalMoves").value(false))
                .andExpect(jsonPath("$.preferences.sound").value(true))
                .andExpect(jsonPath("$.preferences.animationMs").value(240))
                .andExpect(jsonPath("$.preferences.orientation").value("black"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"identifier":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value(username))
                .andExpect(jsonPath("$.user.preferences.siteTheme").value("mahogany"))
                .andExpect(jsonPath("$.user.preferences.orientation").value("black"));
    }

    @Test
    void repeatedLoginAttemptsAreRateLimitedWithRetryGuidance() throws Exception {
        for (int attempt = 0; attempt < 10; attempt++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"identifier\":\"missing-account\",\"password\":\"IncorrectPassword9\"}")
                            .with(request -> { request.setRemoteAddr("198.51.100.44"); return request; }))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identifier\":\"missing-account\",\"password\":\"IncorrectPassword9\"}")
                        .with(request -> { request.setRemoteAddr("198.51.100.44"); return request; }))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.message").value("Too many authentication attempts. Try again shortly."));
    }
}
