package com.courseflow.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT Token Provider for generating and validating JWT tokens.
 * Handles both access tokens (short-lived) and refresh tokens (long-lived).
 */
@Slf4j
@Component
public class JwtTokenProvider {
    
    private final SecretKey secretKey;
    private final long accessTokenTtl;
    private final long refreshTokenTtl;
    
    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-ttl}") long accessTokenTtl,
            @Value("${jwt.refresh-token-ttl}") long refreshTokenTtl) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenTtl = accessTokenTtl;
        this.refreshTokenTtl = refreshTokenTtl;
    }
    
    /**
     * Generate access token for a user.
     * Access tokens are short-lived (default: 15 minutes).
     * 
     * @param userId The user ID
     * @param email The user email
     * @param role The user role
     * @return JWT access token string
     */
    public String generateAccessToken(String userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("role", role);
        claims.put("type", "access");
        
        return generateToken(claims, userId, accessTokenTtl);
    }
    
    /**
     * Generate refresh token for a user.
     * Refresh tokens are long-lived (default: 7 days).
     * 
     * @param userId The user ID
     * @param email The user email
     * @return JWT refresh token string
     */
    public String generateRefreshToken(String userId, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("type", "refresh");
        
        return generateToken(claims, userId, refreshTokenTtl);
    }
    
    /**
     * Generate a JWT token with the given claims and expiration time.
     */
    private String generateToken(Map<String, Object> claims, String subject, long expirationMs) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMs);
        
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secretKey)
                .compact();
    }
    
    /**
     * Validate a JWT token.
     * 
     * @param token The token to validate
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.debug("Invalid token: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Extract user ID (subject) from token.
     * 
     * @param token The JWT token
     * @return User ID
     */
    public String getUserIdFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }
    
    /**
     * Extract email from token.
     * 
     * @param token The JWT token
     * @return User email
     */
    public String getEmailFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("email", String.class));
    }
    
    /**
     * Extract role from token.
     * 
     * @param token The JWT token
     * @return User role
     */
    public String getRoleFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("role", String.class));
    }
    
    /**
     * Check if token is a refresh token.
     * 
     * @param token The JWT token
     * @return true if token is a refresh token
     */
    public boolean isRefreshToken(String token) {
        String type = getClaimFromToken(token, claims -> claims.get("type", String.class));
        return "refresh".equals(type);
    }
    
    /**
     * Check if token is an access token.
     * 
     * @param token The JWT token
     * @return true if token is an access token
     */
    public boolean isAccessToken(String token) {
        String type = getClaimFromToken(token, claims -> claims.get("type", String.class));
        return "access".equals(type);
    }
    
    /**
     * Extract a claim from token.
     * 
     * @param token The JWT token
     * @param claimsResolver Function to extract the claim
     * @return The claim value
     */
    private <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Get all claims from token.
     * 
     * @param token The JWT token
     * @return Claims object
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

