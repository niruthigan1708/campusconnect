package com.campusconnect.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String VALID_SECRET =
            "a-valid-test-secret-that-is-comfortably-longer-than-32-bytes";

    @Test
    void rejectsMissingSecret() {
        assertThatThrownBy(() -> new JwtService("", 60_000))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not set");
        assertThatThrownBy(() -> new JwtService(null, 60_000))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejectsPlaceholderSecret() {
        assertThatThrownBy(() -> new JwtService(
                "change-this-to-a-long-random-secret-in-your-env-file-at-least-256-bits", 60_000))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("placeholder");
    }

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new JwtService("too-short", 60_000))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least");
    }

    @Test
    void acceptsStrongSecretAndRoundTripsToken() {
        JwtService jwt = new JwtService(VALID_SECRET, 60_000);
        String token = jwt.generateToken(1L, "a@b.edu", "STUDENT", 3);

        assertThat(jwt.isTokenValid(token)).isTrue();
        assertThat(jwt.extractEmail(token)).isEqualTo("a@b.edu");
        assertThat(jwt.extractTokenVersion(token)).isEqualTo(3);
    }

    @Test
    void rejectsTokenSignedWithDifferentSecret() {
        JwtService other = new JwtService(VALID_SECRET + "-other", 60_000);
        String token = other.generateToken(1L, "a@b.edu", "STUDENT", 0);

        assertThat(new JwtService(VALID_SECRET, 60_000).isTokenValid(token)).isFalse();
    }
}
