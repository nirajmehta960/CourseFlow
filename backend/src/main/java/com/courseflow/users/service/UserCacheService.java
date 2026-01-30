package com.courseflow.users.service;

import com.courseflow.config.RedisConfig;
import com.courseflow.users.model.User;
import com.courseflow.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Service that provides cached user lookups by id and email.
 * Used by UserDetailsServiceImpl so that @Cacheable is applied via proxy.
 */
@Service
@RequiredArgsConstructor
public class UserCacheService {

    private final UserRepository userRepository;

    // @Cacheable(cacheNames = RedisConfig.CACHE_USERS, key = "'email:' + #email")
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    // @Cacheable(cacheNames = RedisConfig.CACHE_USERS, key = "'id:' + #userId")
    public User findById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
    }
}
