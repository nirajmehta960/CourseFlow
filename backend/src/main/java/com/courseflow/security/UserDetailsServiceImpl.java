package com.courseflow.security;

import com.courseflow.users.model.User;
import com.courseflow.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Loads user details for Spring Security authentication.
 * 
 * Spring Security calls this when authenticating users (during login).
 * It needs user details (email, password hash, roles) to validate credentials.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    
    private final UserRepository userRepository;
    
    /**
     * Called by Spring Security during authentication.
     * 
     * Flow:
     * 1. User submits email/password
     * 2. Spring Security calls this method with email
     * 3. We load user from database
     * 4. Spring Security compares password hash with provided password
     * 
     * @param email User's email (used as username)
     * @return UserDetails containing user info and password hash
     * @throws UsernameNotFoundException if user doesn't exist
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        
        // Wrap User entity in SecurityUserDetails (Spring Security format)
        return new SecurityUserDetails(user);
    }
    
    /**
     * Load user by ID (useful for JWT token validation).
     * 
     * When we validate a JWT token, we get user ID from token,
     * then need to load full user details from database.
     */
    public SecurityUserDetails loadUserById(@org.springframework.lang.NonNull String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        
        return new SecurityUserDetails(user);
    }
}

