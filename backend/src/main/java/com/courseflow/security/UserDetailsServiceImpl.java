package com.courseflow.security;

import com.courseflow.users.model.User;
import com.courseflow.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * UserDetailsService implementation for loading user details during authentication.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    
    private final UserRepository userRepository;
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        
        return new SecurityUserDetails(user);
    }
    
    /**
     * Load user details by user ID.
     * 
     * @param userId The user ID
     * @return UserDetails
     * @throws UsernameNotFoundException if user not found
     */
    public SecurityUserDetails loadUserById(@org.springframework.lang.NonNull String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
        
        return new SecurityUserDetails(user);
    }
}

