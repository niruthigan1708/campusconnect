package com.campusconnect.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

class AuthRateLimitingFilterTest {

    private static final int LIMIT = 10;
    private final AtomicLong now = new AtomicLong(1_000_000);
    private AuthRateLimitingFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthRateLimitingFilter(now::get, LIMIT);
    }

    private MockHttpServletResponse send(String ip, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void blocksRequestsOverTheLimitWithRetryAfter() throws Exception {
        for (int i = 0; i < LIMIT; i++) {
            assertThat(send("1.1.1.1", "/api/auth/login").getStatus()).isEqualTo(200);
        }

        MockHttpServletResponse blocked = send("1.1.1.1", "/api/auth/login");

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isEqualTo("60");
    }

    @Test
    void limitsAreTrackedPerClientIp() throws Exception {
        for (int i = 0; i <= LIMIT; i++) {
            send("1.1.1.1", "/api/auth/login");
        }

        assertThat(send("2.2.2.2", "/api/auth/login").getStatus()).isEqualTo(200);
    }

    @Test
    void allowsRequestsAgainOnceTheWindowHasPassed() throws Exception {
        for (int i = 0; i <= LIMIT; i++) {
            send("1.1.1.1", "/api/auth/login");
        }
        now.addAndGet(AuthRateLimitingFilter.WINDOW_MILLIS);

        assertThat(send("1.1.1.1", "/api/auth/login").getStatus()).isEqualTo(200);
    }

    @Test
    void ignoresPathsThatAreNotRateLimited() throws Exception {
        for (int i = 0; i < 50; i++) {
            assertThat(send("1.1.1.1", "/api/events").getStatus()).isEqualTo(200);
        }
        assertThat(filter.trackedClientCount()).isZero();
    }

    @Test
    void evictionRemovesOnlyExpiredWindows() throws Exception {
        send("1.1.1.1", "/api/auth/login");
        now.addAndGet(AuthRateLimitingFilter.WINDOW_MILLIS / 2);
        send("2.2.2.2", "/api/auth/login");
        now.addAndGet(AuthRateLimitingFilter.WINDOW_MILLIS / 2);

        filter.evictExpiredWindows();

        assertThat(filter.trackedClientCount()).isEqualTo(1);
    }
}
