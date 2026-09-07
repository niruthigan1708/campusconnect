package com.campusconnect.security;

import com.campusconnect.entity.RefreshToken;
import com.campusconnect.entity.User;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Transactional
    public String issueToken(User user) {
        String rawToken = SecureTokenUtil.generate();
        RefreshToken token = RefreshToken.builder()
                .tokenHash(SecureTokenUtil.hash(rawToken))
                .user(user)
                .expiresAt(LocalDateTime.now().plus(refreshExpirationMs, ChronoUnit.MILLIS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(token);
        return rawToken;
    }

    /**
     * Validates a refresh token and revokes it (single-use rotation - each refresh
     * call issues a brand new refresh token via {@link #issueToken}, so a stolen
     * token can't be replayed once the legitimate client has used it).
     */
    @Transactional
    public RefreshToken validateAndConsume(String rawToken) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(SecureTokenUtil.hash(rawToken))
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (token.isRevoked() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Refresh token expired or revoked - please log in again");
        }

        token.setRevoked(true);
        return token;
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(SecureTokenUtil.hash(rawToken))
                .ifPresent(token -> token.setRevoked(true));
    }

    @Transactional
    public void revokeAllForUser(User user) {
        refreshTokenRepository.revokeAllForUser(user);
    }
}
