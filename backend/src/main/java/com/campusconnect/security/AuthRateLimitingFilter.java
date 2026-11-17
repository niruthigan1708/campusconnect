package com.campusconnect.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.LongSupplier;

/**
 * Simple fixed-window rate limiter for the auth endpoints most exposed to
 * brute-forcing / enumeration. Keyed by client IP + path and held in memory,
 * so this protects a single instance only - a multi-instance deployment
 * behind a load balancer would need a shared store (e.g. Redis) instead.
 *
 * <p>The client IP comes from {@link HttpServletRequest#getRemoteAddr()}. Behind
 * a reverse proxy that would be the proxy's IP for every user; with
 * {@code server.forward-headers-strategy=native} (see application.yml) Tomcat
 * replaces it with the X-Forwarded-For client IP, but only when the request
 * comes from a trusted internal proxy address, so direct clients can't spoof it.
 */
@Component
public class AuthRateLimitingFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password"
    );
    static final long WINDOW_MILLIS = 60_000;

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();
    private final LongSupplier clock;
    private final int maxRequestsPerWindow;

    private static final class Window {
        final long startedAt;
        final AtomicInteger count;

        Window(long startedAt) {
            this.startedAt = startedAt;
            this.count = new AtomicInteger(0);
        }
    }

    /**
     * The per-IP cap is deliberately loose (default 30/min): on a campus many
     * students share one NAT address. Per-account brute forcing is handled
     * separately and more tightly by {@link LoginAttemptService}.
     */
    @Autowired
    public AuthRateLimitingFilter(@Value("${app.rate-limit.auth-requests-per-minute:30}") int maxRequestsPerWindow) {
        this(System::currentTimeMillis, maxRequestsPerWindow);
    }

    AuthRateLimitingFilter(LongSupplier clock, int maxRequestsPerWindow) {
        this.clock = clock;
        this.maxRequestsPerWindow = maxRequestsPerWindow;
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
        long now = clock.getAsLong();

        Window window = buckets.compute(key, (k, existing) ->
                (existing == null || isExpired(existing, now)) ? new Window(now) : existing);
        int requestsSoFar = window.count.incrementAndGet();

        if (requestsSoFar > maxRequestsPerWindow) {
            long retryAfterSeconds = Math.max(1, (window.startedAt + WINDOW_MILLIS - now + 999) / 1000);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Too many requests - please try again in a minute\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Expired windows were previously only replaced when the same IP+path came
     * back, so every one-off client left an entry behind forever. Sweeping
     * them keeps memory bounded by the number of clients active in the last minute.
     */
    @Scheduled(fixedRate = WINDOW_MILLIS)
    void evictExpiredWindows() {
        long now = clock.getAsLong();
        buckets.values().removeIf(window -> isExpired(window, now));
    }

    int trackedClientCount() {
        return buckets.size();
    }

    private static boolean isExpired(Window window, long now) {
        return now - window.startedAt >= WINDOW_MILLIS;
    }
}
