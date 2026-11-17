package com.campusconnect.security;

import com.campusconnect.exception.TooManyRequestsException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

/**
 * Throttles repeated failed logins for one account from one IP address.
 *
 * <p>The per-IP {@link AuthRateLimitingFilter} alone is a poor fit for a campus,
 * where hundreds of students can share one public NAT address: a tight per-IP
 * limit would lock them all out together. This keys on email + IP instead, so
 * password guessing against an account is slowed down while other students on
 * the same network are unaffected. Including the IP also means an attacker
 * can't lock a victim out from everywhere just by failing logins for them.
 *
 * <p>In-memory, so per instance only (same caveat as the filter).
 */
@Service
public class LoginAttemptService {

    static final int MAX_FAILURES = 5;
    static final long LOCK_WINDOW_MILLIS = 15 * 60_000;

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();
    private final LongSupplier clock;

    private record Attempts(long windowStartedAt, int failures) {
    }

    public LoginAttemptService() {
        this(System::currentTimeMillis);
    }

    LoginAttemptService(LongSupplier clock) {
        this.clock = clock;
    }

    public void checkNotBlocked(String email, String clientIp) {
        Attempts current = attempts.get(key(email, clientIp));
        long now = clock.getAsLong();
        if (current != null && !isExpired(current, now) && current.failures() >= MAX_FAILURES) {
            long retryAfterSeconds = Math.max(1, (current.windowStartedAt() + LOCK_WINDOW_MILLIS - now + 999) / 1000);
            throw new TooManyRequestsException(
                    "Too many failed login attempts - please try again in " + ((retryAfterSeconds + 59) / 60) + " minutes",
                    retryAfterSeconds);
        }
    }

    public void recordFailure(String email, String clientIp) {
        long now = clock.getAsLong();
        attempts.compute(key(email, clientIp), (k, existing) ->
                (existing == null || isExpired(existing, now))
                        ? new Attempts(now, 1)
                        : new Attempts(existing.windowStartedAt(), existing.failures() + 1));
    }

    public void recordSuccess(String email, String clientIp) {
        attempts.remove(key(email, clientIp));
    }

    @Scheduled(fixedRate = 60_000)
    void evictExpired() {
        long now = clock.getAsLong();
        attempts.values().removeIf(a -> isExpired(a, now));
    }

    int trackedCount() {
        return attempts.size();
    }

    private static String key(String email, String clientIp) {
        return email.trim().toLowerCase(Locale.ROOT) + "|" + clientIp;
    }

    private static boolean isExpired(Attempts a, long now) {
        return now - a.windowStartedAt() >= LOCK_WINDOW_MILLIS;
    }
}
