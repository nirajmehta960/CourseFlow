package com.courseflow.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * MongoDB configuration.
 * Enables MongoDB auditing for automatic createdAt/updatedAt timestamps.
 * Connection details are configured via application.yml
 */
@Configuration
@EnableMongoAuditing
public class MongoConfig {
    // MongoDB configuration is handled via application.yml
    // This class enables auditing for @CreatedDate and @LastModifiedDate annotations
}

