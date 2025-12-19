package com.courseflow.modules.controller;

import com.courseflow.common.dto.ApiResponse;
import com.courseflow.modules.dto.ModuleRequest;
import com.courseflow.modules.dto.ModuleResponse;
import com.courseflow.modules.service.ModuleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for module endpoints.
 */
@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@Tag(name = "Modules", description = "Course module management endpoints")
public class ModuleController {
    
    private final ModuleService moduleService;
    
    @GetMapping("/{courseId}/modules")
    @Operation(summary = "Get course modules", description = "Get module tree for a course. User must be enrolled in the course.")
    public ResponseEntity<ApiResponse<ModuleResponse>> getModules(
            @PathVariable String courseId) {
        ModuleResponse modules = moduleService.getModules(courseId);
        return ResponseEntity.ok(ApiResponse.success(modules));
    }
    
    @PutMapping("/{courseId}/modules")
    @Operation(summary = "Update modules", description = "Replace entire module tree for a course. Only instructors and admins can update modules.")
    public ResponseEntity<ApiResponse<ModuleResponse>> updateModules(
            @PathVariable String courseId,
            @Valid @RequestBody ModuleRequest.UpdateModulesRequest request) {
        ModuleResponse modules = moduleService.updateModules(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(modules, "Modules updated successfully"));
    }
    
    @PostMapping("/{courseId}/modules")
    @Operation(summary = "Add module", description = "Add a new module to a course. Only instructors and admins can add modules.")
    public ResponseEntity<ApiResponse<ModuleResponse>> addModule(
            @PathVariable String courseId,
            @Valid @RequestBody ModuleRequest.AddModuleRequest request) {
        ModuleResponse modules = moduleService.addModule(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(modules, "Module added successfully"));
    }
    
    @PostMapping("/{courseId}/modules/{moduleId}/items")
    @Operation(summary = "Add module item", description = "Add a new item to a module. Only instructors and admins can add module items.")
    public ResponseEntity<ApiResponse<ModuleResponse>> addModuleItem(
            @PathVariable String courseId,
            @PathVariable String moduleId,
            @Valid @RequestBody ModuleRequest.AddModuleItemRequest request) {
        ModuleResponse modules = moduleService.addModuleItem(courseId, moduleId, request);
        return ResponseEntity.ok(ApiResponse.success(modules, "Module item added successfully"));
    }
}

