package com.campusconnect.service;

import com.campusconnect.entity.PasswordResetToken;
import com.campusconnect.entity.User;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.repository.PasswordResetTokenRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.RefreshTokenService;
import com.campusconnect.security.SecureTokenUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    @Value("${app.password-reset.expiration-ms}")
    private long resetExpirationMs;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public void requestReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String rawToken = SecureTokenUtil.generate();
            PasswordResetToken token = PasswordResetToken.builder()
                    .tokenHash(SecureTokenUtil.hash(rawToken))
                    .user(user)
                    .expiresAt(LocalDateTime.now().plus(resetExpirationMs, ChronoUnit.MILLIS))
                    .used(false)
                    .build();
            tokenRepository.save(token);

            String resetLink = frontendUrl + "/reset-password?token=" + rawToken;
            // No email provider is configured for this project, so the link is logged
            // instead - a real deployment would send this through an email service.
            log.info("Password reset requested for {}. Reset link: {}", email, resetLink);
        });
        // Always succeeds from the caller's perspective, whether or not the email
        // matched an account, so this endpoint can't be used to enumerate users.
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = tokenRepository.findByTokenHash(SecureTokenUtil.hash(rawToken))
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));

        if (token.isUsed() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invalid or expired reset link");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        token.setUsed(true);

        // A password reset invalidates any sessions started before it.
        refreshTokenService.revokeAllForUser(user);
    }
}
