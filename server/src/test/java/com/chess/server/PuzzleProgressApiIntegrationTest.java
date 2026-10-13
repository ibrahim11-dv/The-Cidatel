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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:puzzle-progress-tests;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class PuzzleProgressApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper json;

    @Test
    void authenticatedAccountsPersistOnlyTheirOwnValidatedPuzzleProgress() throws Exception {
        mockMvc.perform(get("/api/puzzles/progress")).andExpect(status().isUnauthorized());
        String first = register();
        String second = register();

        mockMvc.perform(get("/api/puzzles/progress").header("Authorization", "Bearer " + first))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").isEmpty())
                .andExpect(jsonPath("$.stats.attempted").value(0));

        String progress = """
                {"completed":["quiet-crown","legals-mate"],"stats":{"attempted":3,"solved":2,"unassisted":1,"streak":1,"best":1,"active":{"id":"legals-mate","failed":false,"solved":true,"revealed":false}}}
                """;
        mockMvc.perform(put("/api/puzzles/progress")
                        .header("Authorization", "Bearer " + first)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(progress))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed[1]").value("legals-mate"))
                .andExpect(jsonPath("$.stats.unassisted").value(1));

        mockMvc.perform(get("/api/puzzles/progress").header("Authorization", "Bearer " + first))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed.length()").value(2))
                .andExpect(jsonPath("$.stats.active.id").value("legals-mate"));
        mockMvc.perform(get("/api/puzzles/progress").header("Authorization", "Bearer " + second))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").isEmpty())
                .andExpect(jsonPath("$.stats.solved").value(0));

        mockMvc.perform(put("/api/puzzles/progress")
                        .header("Authorization", "Bearer " + first)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""" 
                                {"completed":["quiet-crown"],"stats":{"attempted":1,"solved":2,"unassisted":0,"streak":0,"best":0,"active":null}}
                                """))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/puzzles/progress")
                        .header("Authorization", "Bearer " + first)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""" 
                                {"completed":["invalid id"],"stats":{"attempted":0,"solved":0,"unassisted":0,"streak":0,"best":0,"active":null}}
                                """))
                .andExpect(status().isBadRequest());
    }

    private String register() throws Exception {
        String username = "puzzle_" + UUID.randomUUID().toString().substring(0, 8);
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","email":"%s@example.test","password":"QuietTable9"}
                                """.formatted(username, username)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode response = json.readTree(result.getResponse().getContentAsString());
        return response.path("accessToken").asText();
    }
}
