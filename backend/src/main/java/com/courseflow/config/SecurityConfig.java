package com.courseflow.config;

import com.courseflow.security.JwtAuthenticationFilter;
import com.courseflow.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Spring Security configuration for JWT-based authentication.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final UserDetailsServiceImpl userDetailsService;
        private final CorsConfigurationSource corsConfigurationSource;

        @Bean
        public org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer webSecurityCustomizer() {
                return (web) -> web.ignoring().requestMatchers(
                                AntPathRequestMatcher.antMatcher("/health"),
                                AntPathRequestMatcher.antMatcher("/api/health"),
                                AntPathRequestMatcher.antMatcher("/error"),
                                AntPathRequestMatcher.antMatcher("/v3/api-docs/**"),
                                AntPathRequestMatcher.antMatcher("/swagger-ui/**"),
                                AntPathRequestMatcher.antMatcher("/swagger-ui.html"));
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                                .authorizeHttpRequests(auth -> auth
                                                // Permit all OPTIONS requests for CORS preflight
                                                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.OPTIONS,
                                                                "/**"))
                                                .permitAll()
                                                // Public auth endpoints, health checks, and error path
                                                .requestMatchers(
                                                                AntPathRequestMatcher.antMatcher("/auth/signup"),
                                                                AntPathRequestMatcher.antMatcher("/auth/signin"),
                                                                AntPathRequestMatcher.antMatcher("/auth/refresh"),
                                                                AntPathRequestMatcher.antMatcher("/auth/signout"),
                                                                AntPathRequestMatcher.antMatcher("/health"),
                                                                AntPathRequestMatcher.antMatcher("/api/health"),
                                                                AntPathRequestMatcher.antMatcher("/ws/**"),
                                                                AntPathRequestMatcher.antMatcher("/api/ws/**"),
                                                                AntPathRequestMatcher.antMatcher("/error"))
                                                .permitAll()
                                                // Swagger/OpenAPI documentation endpoints (public access)
                                                .requestMatchers(
                                                                AntPathRequestMatcher.antMatcher("/swagger-ui/**"),
                                                                AntPathRequestMatcher.antMatcher("/swagger-ui.html"),
                                                                AntPathRequestMatcher.antMatcher("/v3/api-docs/**"),
                                                                AntPathRequestMatcher.antMatcher("/v3/api-docs"),
                                                                AntPathRequestMatcher
                                                                                .antMatcher("/swagger-resources/**"),
                                                                AntPathRequestMatcher.antMatcher("/webjars/**"),
                                                                AntPathRequestMatcher
                                                                                .antMatcher("/swagger-ui/index.html"),
                                                                AntPathRequestMatcher.antMatcher("/api-docs/**"))
                                                .permitAll()
                                                // Root API path (for testing)
                                                .requestMatchers(
                                                                AntPathRequestMatcher.antMatcher("/"),
                                                                AntPathRequestMatcher.antMatcher("/api"),
                                                                AntPathRequestMatcher.antMatcher("/api/"))
                                                .permitAll()
                                                // All other endpoints require authentication
                                                .anyRequest().authenticated())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
                provider.setUserDetailsService(userDetailsService);
                provider.setPasswordEncoder(passwordEncoder());
                return provider;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
