package com.courseflow.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertiesPropertySource;

import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;

/**
 * Automatically loads .env file when Spring Boot starts (just like Node.js).
 * 
 * Why we need this:
 * - Spring Boot doesn't load .env files by default (unlike Node.js)
 * - We want developers to just create .env file and it works automatically
 * - No need for wrapper scripts or manual environment variable setup
 * 
 * How it works:
 * - Runs BEFORE any beans are created (EnvironmentPostProcessor)
 * - Loads .env variables into Spring environment
 * - Variables are available for @Value("${VAR_NAME}") annotations
 * - Takes highest priority (overrides application.yml defaults)
 */
@Slf4j
public class EnvFileEnvironmentPostProcessor implements EnvironmentPostProcessor {
    
    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Try common locations where .env file might be
        // This handles running from different directories (backend/, project root, etc.)
        Path[] possiblePaths = {
            Paths.get(".env"),                              // Current directory (backend/)
            Paths.get("backend/.env"),                      // From project root
            Paths.get(System.getProperty("user.dir"), ".env"),  // User directory
            Paths.get(System.getProperty("user.dir"), "backend", ".env")  // User directory/backend
        };
        
        // Use first .env file found
        for (Path envPath : possiblePaths) {
            if (Files.exists(envPath) && Files.isRegularFile(envPath)) {
                loadEnvFile(envPath, environment);
                return;
            }
        }
        
        // Warn if .env not found (but don't fail - might be using system env vars)
        log.warn(".env file not found. Tried: {}", String.join(", ", 
            java.util.Arrays.stream(possiblePaths).map(Path::toString).toArray(String[]::new)));
    }
    
    /**
     * Parse .env file and load variables into Spring environment.
     * 
     * Supports standard .env format:
     * - KEY=value
     * - Empty lines and # comments are ignored
     * - Quotes around values are removed
     */
    private void loadEnvFile(Path envPath, ConfigurableEnvironment environment) {
        try {
            Properties properties = new Properties();
            int loadedCount = 0;
            
            try (BufferedReader reader = Files.newBufferedReader(envPath)) {
                String line;
                
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    
                    // Skip empty lines and comments
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    
                    // Parse KEY=value format
                    int equalsIndex = line.indexOf('=');
                    if (equalsIndex > 0) {
                        String key = line.substring(0, equalsIndex).trim();
                        String value = line.substring(equalsIndex + 1).trim();
                        
                        // Remove quotes if present (handles "value" or 'value')
                        if ((value.startsWith("\"") && value.endsWith("\"")) ||
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length() - 1);
                        }
                        
                        properties.setProperty(key, value);
                        loadedCount++;
                    }
                }
            }
            
            // Add to environment with HIGHEST priority (overrides application.yml)
            // This means .env variables take precedence over config file defaults
            PropertiesPropertySource envPropertySource = new PropertiesPropertySource("env", properties);
            environment.getPropertySources().addFirst(envPropertySource);
            
            log.info("Loaded {} environment variables from .env file: {}", 
                    loadedCount, envPath.toAbsolutePath());
            
        } catch (Exception e) {
            log.error("Failed to load .env file from: {}", envPath, e);
        }
    }
}
