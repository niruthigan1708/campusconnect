package com.campusconnect.service;

import com.campusconnect.entity.PasswordResetToken;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.repository.PasswordResetTokenRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.RefreshTokenService;
import com.campusconnect.security.SecureTokenUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetTokenRepository tokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private MailService mailService;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).name("Sam Student").email("sam@campus.edu").role(Role.STUDENT).build();
        ReflectionTestUtils.setField(passwordResetService, "resetExpirationMs", 1_800_000L);
        ReflectionTestUtils.setField(passwordResetService, "frontendUrl", "http://localhost:3000");
    }

    @Test
    void requestReset_savesTokenWhenUserExists() {
        when(userRepository.findByEmail("sam@campus.edu")).thenReturn(Optional.of(user));

        passwordResetService.requestReset("sam@campus.edu");

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().isUsed()).isFalse();
    }

    @Test
    void requestReset_doesNothingSilentlyWhenEmailUnknown() {
        when(userRepository.findByEmail("nobody@campus.edu")).thenReturn(Optional.empty());

        passwordResetService.requestReset("nobody@campus.edu");

        verifyNoInteractions(tokenRepository);
    }

    @Test
    void resetPassword_updatesPasswordAndRevokesSessions() {
        String rawToken = "raw-token";
        PasswordResetToken token = PasswordResetToken.builder()
                .id(1L).user(user).used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        when(tokenRepository.findByTokenHash(SecureTokenUtil.hash(rawToken))).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewPassword123!")).thenReturn("hashed");

        passwordResetService.resetPassword(rawToken, "NewPassword123!");

        assertThat(user.getPassword()).isEqualTo("hashed");
        assertThat(token.isUsed()).isTrue();
        verify(refreshTokenService).revokeAllForUser(user);
    }

    @Test
    void resetPassword_throwsWhenTokenAlreadyUsed() {
        String rawToken = "raw-token";
        PasswordResetToken token = PasswordResetToken.builder()
                .id(1L).user(user).used(true)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        when(tokenRepository.findByTokenHash(SecureTokenUtil.hash(rawToken))).thenReturn(Optional.of(token));

        assertThrows(BadRequestException.class, () -> passwordResetService.resetPassword(rawToken, "NewPassword123!"));
        verifyNoInteractions(refreshTokenService);
    }

    @Test
    void resetPassword_throwsWhenTokenExpired() {
        String rawToken = "raw-token";
        PasswordResetToken token = PasswordResetToken.builder()
                .id(1L).user(user).used(false)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .build();
        when(tokenRepository.findByTokenHash(SecureTokenUtil.hash(rawToken))).thenReturn(Optional.of(token));

        assertThrows(BadRequestException.class, () -> passwordResetService.resetPassword(rawToken, "NewPassword123!"));
    }

    @Test
    void resetPassword_throwsWhenTokenUnknown() {
        when(tokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> passwordResetService.resetPassword("bogus", "NewPassword123!"));
    }
}
