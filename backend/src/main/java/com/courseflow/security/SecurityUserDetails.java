package com.courseflow.security;

import com.courseflow.users.model.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import com.courseflow.users.model.User;

/**
 * Spring Security UserDetails implementation for JWT authentication.
 */
@Getter
public class SecurityUserDetails implements UserDetails {
    
    private final String id;
    private final String email;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    
    public SecurityUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        
        // Convert user roles to Spring Security authorities
        List<GrantedAuthority> authoritiesList = new ArrayList<>();
        if (user.getRoles() != null) {
            for (User.UserRole role : user.getRoles()) {
                authoritiesList.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
            }
        } else {
            // Fallback to STUDENT if roles is null
            authoritiesList.add(new SimpleGrantedAuthority("ROLE_STUDENT"));
        }
        this.authorities = authoritiesList;
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
    
    @Override
    public String getPassword() {
        return password;
    }
    
    @Override
    public String getUsername() {
        return email;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return true;
    }
}

