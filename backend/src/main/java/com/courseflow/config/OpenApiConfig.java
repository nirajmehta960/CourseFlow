package com.courseflow.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for API documentation.
 */
@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI courseFlowOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CourseFlow API")
                        .description("Spring Boot 3 backend API for CourseFlow Learning Management System")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("CourseFlow Team")
                                .email("support@courseflow.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:4000/api")
                                .description("Development Server"),
                        new Server()
                                .url("https://api.courseflow.com/api")
                                .description("Production Server")
                ));
    }
}

