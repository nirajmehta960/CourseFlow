package com.courseflow.common.controller;

import com.courseflow.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Root controller for API information.
 */
@RestController
@RequestMapping("/")
@Tag(name = "Root", description = "API root and information endpoints")
public class RootController {
    
    @GetMapping
    @Operation(summary = "Get API information", description = "Returns API version and available endpoints")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getApiInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", "CourseFlow API");
        info.put("version", "1.0.0");
        info.put("description", "Learning Management System API");
        info.put("documentation", "/swagger-ui.html");
        info.put("apiDocs", "/v3/api-docs");
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("auth", "/auth");
        endpoints.put("courses", "/courses");
        endpoints.put("assignments", "/courses/{courseId}/assignments");
        endpoints.put("modules", "/courses/{courseId}/modules");
        endpoints.put("grades", "/courses/{courseId}/grades");
        info.put("endpoints", endpoints);
        
        return ResponseEntity.ok(ApiResponse.success(info, "CourseFlow API is running"));
    }
}

