package com.campusconnect.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple fixed-window rate limiter for the auth endpoints most exposed to
 * brute-forcing / enumeration (login, register, forgot-password). Keyed by
 * client IP + path and held in memory, so this protects a single instance
 * only - a multi-instance deployment behind a load balancer would need a
 * shared store (e.g. Redis) instead.
 */
@Component
public class AuthRateLimitingFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/auth/login", "/api/auth/register", "/api/auth/forgot-password"
    );
    private static final int MAX_REQUESTS_PER_WINDOW = 10;
    private static final long WINDOW_MILLIS = 60_000;

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();

    private static final class Window {
        final long startedAt;
        final AtomicInteger count;

        Window(long startedAt) {
            this.startedAt = startedAt;
            this.count = new AtomicInteger(0);
        }
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if (!LIMITED_PATHS.contains(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = request.getRemoteAddr() + ":" + request.getRequestURI();
        long now = System.currentTimeMillis();

        Window window = buckets.compute(key, (k, existing) ->
                (existing == null || now - existing.startedAt >= WINDOW_MILLIS) ? new Window(now) : existing);
        int requestsSoFar = window.count.incrementAndGet();

        if (requestsSoFar > MAX_REQUESTS_PER_WINDOW) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Too many requests - please try again in a minute\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
