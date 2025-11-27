package com.courseflow.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

/**
 * MongoDB connection configuration.
 * 
 * Why we need this:
 * - MongoDB Atlas connection URI might include a database name, but we want to use 'CourseFlow' explicitly
 * - This ensures we always connect to the correct database regardless of what's in the URI
 * - Prevents issues where URI has different database name than what we want
 * 
 * Also enables MongoDB auditing (@CreatedDate, @LastModifiedDate) for automatic timestamps.
 */
@Slf4j
@Configuration
@EnableMongoAuditing
public class MongoConfig {
    
    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;
    
    @Value("${spring.data.mongodb.database:CourseFlow}")
    private String databaseName;
    
    /**
     * Creates MongoDB connection factory with explicit database name.
     * 
     * Even if the connection URI includes a database name, we override it here
     * to ensure we always use 'CourseFlow' database. This prevents connection
     * to wrong database if URI has a different name.
     * 
     * Note: Connection is lazy - actual connection happens on first use,
     * which allows DNS SRV lookups to work properly.
     */
    @Bean
    public MongoDatabaseFactory mongoDatabaseFactory() {
        MongoClient mongoClient = MongoClients.create(mongoUri);
        // Explicitly set database name (overrides any name in URI)
        return new SimpleMongoClientDatabaseFactory(mongoClient, databaseName);
    }
    
    /**
     * Creates MongoTemplate for database operations.
     * Uses the factory above, so it will use the 'CourseFlow' database.
     */
    @Bean
    public MongoTemplate mongoTemplate() {
        return new MongoTemplate(mongoDatabaseFactory());
    }
    
}

