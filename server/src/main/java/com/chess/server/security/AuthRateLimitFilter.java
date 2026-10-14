package com.chess.server.security;

import com.chess.server.api.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Keeps password guessing and account-creation bursts from consuming unbounded
 * server work. Deliberately in-process: deployments with several API instances
 * should enforce the same policy at their shared edge or store.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int TOO_MANY_REQUESTS = 429;
    private static final int LOGIN_CLIENT_LIMIT = 10;
    private static final int REGISTER_CLIENT_LIMIT = 30;

    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final Map<String, Window> windows = new HashMap<>();

    @Autowired
    public AuthRateLimitFilter(ObjectMapper objectMapper) {
        this(objectMapper, Clock.systemUTC());
    }

    AuthRateLimitFilter(ObjectMapper objectMapper, Clock clock) {
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!HttpMethod.POST.matches(request.getMethod())) return true;
        String path = path(request);
        return !"/api/auth/login".equals(path) && !"/api/auth/register".equals(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Instant now = clock.instant();
        String client = request.getRemoteAddr();
        String path = path(request);
        Limit exceeded;
        synchronized (windows) {
            windows.entrySet().removeIf(entry -> !now.isBefore(entry.getValue().startedAt.plus(WINDOW)));
            exceeded = allow(path + ":client:" + client, path.equals("/api/auth/login") ? LOGIN_CLIENT_LIMIT : REGISTER_CLIENT_LIMIT, now);
        }
        if (exceeded != null) {
            long retryAfter = Math.max(1, Duration.between(now, exceeded.startedAt.plus(WINDOW)).toSeconds());
            response.setStatus(TOO_MANY_REQUESTS);
            response.setHeader("Retry-After", Long.toString(retryAfter));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), new ApiError(now, TOO_MANY_REQUESTS,
                    "Too many authentication attempts. Try again shortly."));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private Limit allow(String key, int limit, Instant now) {
        Window window = windows.computeIfAbsent(key, unused -> new Window(now));
        window.attempts++;
        return window.attempts > limit ? new Limit(window.startedAt) : null;
    }

    private String path(HttpServletRequest request) {
        String context = request.getContextPath();
        String uri = request.getRequestURI();
        return uri.startsWith(context) ? uri.substring(context.length()) : uri;
    }

    private static final class Window {
        private final Instant startedAt;
        private int attempts;

        private Window(Instant startedAt) {
            this.startedAt = startedAt;
        }
    }

    private record Limit(Instant startedAt) { }
}
