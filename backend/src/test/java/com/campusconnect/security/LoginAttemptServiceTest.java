package com.campusconnect.security;

import com.campusconnect.exception.TooManyRequestsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginAttemptServiceTest {

    private static final String EMAIL = "sam@campus.edu";
    private static final String CAMPUS_IP = "203.0.113.7";

    private final AtomicLong now = new AtomicLong(1_000_000);
    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        service = new LoginAttemptService(now::get);
    }

    private void failTimes(String email, String ip, int times) {
        for (int i = 0; i < times; i++) {
            service.recordFailure(email, ip);
        }
    }

    @Test
    void blocksAfterMaxFailuresWithRetryAfter() {
        failTimes(EMAIL, CAMPUS_IP, LoginAttemptService.MAX_FAILURES);

        assertThatThrownBy(() -> service.checkNotBlocked(EMAIL, CAMPUS_IP))
                .isInstanceOf(TooManyRequestsException.class)
                .extracting("retryAfterSeconds").isEqualTo(15 * 60L);
    }

    @Test
    void allowsAttemptsBelowTheLimit() {
        failTimes(EMAIL, CAMPUS_IP, LoginAttemptService.MAX_FAILURES - 1);

        assertThatCode(() -> service.checkNotBlocked(EMAIL, CAMPUS_IP)).doesNotThrowAnyException();
    }

    @Test
    void otherStudentsOnTheSameNetworkAreUnaffected() {
        failTimes(EMAIL, CAMPUS_IP, LoginAttemptService.MAX_FAILURES);

        assertThatCode(() -> service.checkNotBlocked("irene@campus.edu", CAMPUS_IP)).doesNotThrowAnyException();
    }

    @Test
    void sameAccountFromAnotherIpIsUnaffected() {
        failTimes(EMAIL, CAMPUS_IP, LoginAttemptService.MAX_FAILURES);

        assertThatCode(() -> service.checkNotBlocked(EMAIL, "198.51.100.1")).doesNotThrowAnyException();
    }

    @Test
    void emailMatchingIsCaseInsensitive() {
        failTimes("Sam@Campus.edu ", CAMPUS_IP, LoginAttemptService.MAX_FAILURES);

        assertThatThrownBy(() -> service.checkNotBlocked(EMAIL, CAMPUS_IP))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void successfulLoginClearsFailures() {
        failTimes(EMAIL, CAMPUS_IP, LoginAttemptService.MAX_FAILURES - 1);
        service.recordSuccess(EMAIL, CAMPUS_IP);
        failTimes(EMAIL, CAMPUS_IP, LoginAttemptService.MAX_FAILURES - 1);

        assertThatCode(() -> service.checkNotBlocked(EMAIL, CAMPUS_IP)).doesNotThrowAnyException();
    }

    @Test
    void lockExpiresAfterTheWindowAndIsEvicted() {
        failTimes(EMAIL, CAMPUS_IP, LoginAttemptService.MAX_FAILURES);
        now.addAndGet(LoginAttemptService.LOCK_WINDOW_MILLIS);

        assertThatCode(() -> service.checkNotBlocked(EMAIL, CAMPUS_IP)).doesNotThrowAnyException();
        service.evictExpired();
        assertThat(service.trackedCount()).isZero();
    }
}
