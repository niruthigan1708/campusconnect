package com.campusconnect.service;

import com.campusconnect.dto.auth.AuthResponse;
import com.campusconnect.dto.auth.LoginRequest;
import com.campusconnect.dto.auth.RegisterRequest;
import com.campusconnect.entity.Club;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.DuplicateResourceException;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ClubRepository clubRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest studentRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Sam Student");
        request.setEmail("sam@campus.edu");
        request.setPassword("Password123!");
        request.setRole(Role.STUDENT);
        return request;
    }

    private RegisterRequest organizerRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alex Organizer");
        request.setEmail("alex@campus.edu");
        request.setPassword("Password123!");
        request.setRole(Role.ORGANIZER);
        request.setClubName("Tech Society");
        request.setClubDescription("We build things");
        request.setClubContactEmail("tech@campus.edu");
        return request;
    }

    @BeforeEach
    void setUp() {
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("hashed-password");
        lenient().when(jwtService.generateToken(anyLong(), anyString(), anyString())).thenReturn("fake-jwt-token");
    }

    // --- register ---

    @Test
    void register_createsStudentWithoutClub() {
        when(userRepository.existsByEmail("sam@campus.edu")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        AuthResponse response = authService.register(studentRequest());

        assertThat(response.getRole()).isEqualTo(Role.STUDENT);
        assertThat(response.getToken()).isEqualTo("fake-jwt-token");
        verifyNoInteractions(clubRepository);
    }

    @Test
    void register_organizerAlsoCreatesAClub() {
        when(userRepository.existsByEmail("alex@campus.edu")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(2L);
            return u;
        });

        authService.register(organizerRequest());

        ArgumentCaptor<Club> captor = ArgumentCaptor.forClass(Club.class);
        verify(clubRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Tech Society");
        assertThat(captor.getValue().getOrganizer().getId()).isEqualTo(2L);
    }

    @Test
    void register_throwsWhenOrganizerOmitsClubName() {
        RegisterRequest request = organizerRequest();
        request.setClubName(" ");
        when(userRepository.existsByEmail("alex@campus.edu")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsWhenEmailAlreadyExists() {
        when(userRepository.existsByEmail("sam@campus.edu")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(studentRequest()));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsWhenSelfRegisteringAsAdmin() {
        RegisterRequest request = studentRequest();
        request.setRole(Role.ADMIN);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verifyNoInteractions(userRepository);
    }

    // --- login ---

    @Test
    void login_returnsTokenForValidCredentials() {
        User user = User.builder().id(1L).name("Sam Student").email("sam@campus.edu").role(Role.STUDENT).build();
        LoginRequest request = new LoginRequest();
        request.setEmail("sam@campus.edu");
        request.setPassword("Password123!");
        when(userRepository.findByEmail("sam@campus.edu")).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(request);

        assertThat(response.getEmail()).isEqualTo("sam@campus.edu");
        assertThat(response.getToken()).isEqualTo("fake-jwt-token");
        verify(authenticationManager).authenticate(any());
    }
}
