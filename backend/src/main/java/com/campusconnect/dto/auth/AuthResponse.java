package com.campusconnect.dto.auth;

import com.campusconnect.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String name;
    private String email;
    private Role role;
}
