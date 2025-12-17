package com.courseflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for token refresh.
 * Note: In practice, refresh token comes from httpOnly cookie,
 * but this DTO is available if needed for explicit refresh token handling.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenRequest {
    
    private String refreshToken;
}

