package com.classsync.security;

import com.classsync.entity.User;
import com.classsync.entity.UserRole;
import com.classsync.entity.UserStatus;
import com.classsync.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityAuthenticationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // =========================================================================
    // Authentication Tests (Login)
    // =========================================================================

    @Test
    @DisplayName("1. Valid admin login succeeds and returns user info with session")
    void validAdminLoginSucceeds() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "admin@classsync.edu",
                "password", "password123"
        ));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email").value("admin@classsync.edu"))
                .andExpect(jsonPath("$.name").value("System Administrator"))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("2. Valid professor login succeeds and returns user info")
    void validProfessorLoginSucceeds() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "aturing@classsync.edu",
                "password", "password123"
        ));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email").value("aturing@classsync.edu"))
                .andExpect(jsonPath("$.role").value("PROFESSOR"));
    }

    @Test
    @DisplayName("3. Invalid password fails with 401 Unauthorized")
    void invalidPasswordFails() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "admin@classsync.edu",
                "password", "wrongpassword"
        ));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("4. Unknown email fails with 401 Unauthorized")
    void unknownEmailFails() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "nonexistent@classsync.edu",
                "password", "password123"
        ));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("5. Inactive user cannot log in and returns 401 Unauthorized")
    void inactiveUserCannotLogin() throws Exception {
        User inactiveUser = new User(
                "Inactive Prof",
                "inactive@classsync.edu",
                passwordEncoder.encode("password123"),
                UserRole.PROFESSOR,
                "EMP-INACT-001",
                UserStatus.INACTIVE
        );
        userRepository.save(inactiveUser);

        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "inactive@classsync.edu",
                "password", "password123"
        ));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("User account is inactive"));
    }

    // =========================================================================
    // Authorization Tests
    // =========================================================================

    @Test
    @DisplayName("6. Authenticated endpoint works with valid session from login")
    void authenticatedEndpointWorksWithLoginSession() throws Exception {
        String loginJson = objectMapper.writeValueAsString(Map.of(
                "email", "admin@classsync.edu",
                "password", "password123"
        ));

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
        assert session != null;

        mockMvc.perform(get("/api/test/authenticated").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Authenticated access granted"))
                .andExpect(jsonPath("$.username").value("admin@classsync.edu"));
    }

    @Test
    @DisplayName("7. Professor endpoint works for professor")
    @WithMockUser(username = "aturing@classsync.edu", roles = {"PROFESSOR"})
    void professorEndpointWorksForProfessor() throws Exception {
        mockMvc.perform(get("/api/test/professor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Professor access granted"));
    }

    @Test
    @DisplayName("8. Admin endpoint works for admin")
    @WithMockUser(username = "admin@classsync.edu", roles = {"ADMIN"})
    void adminEndpointWorksForAdmin() throws Exception {
        mockMvc.perform(get("/api/test/admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Admin access granted"));
    }

    @Test
    @DisplayName("9. Professor cannot access admin-only endpoint (403 Forbidden)")
    @WithMockUser(username = "aturing@classsync.edu", roles = {"PROFESSOR"})
    void professorCannotAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/admin"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Access is denied"));
    }

    @Test
    @DisplayName("10. Unauthenticated requests to protected endpoints return 401 Unauthorized")
    void unauthenticatedRequestToProtectedEndpointReturns401() throws Exception {
        mockMvc.perform(get("/api/test/authenticated"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        mockMvc.perform(get("/api/test/admin"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("11. Public health endpoint remains accessible without authentication")
    void healthEndpointRemainsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("ClassSync Backend"));
    }
}
