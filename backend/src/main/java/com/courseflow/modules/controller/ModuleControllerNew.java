package com.courseflow.modules.controller;

import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.security.RequireInstructor;
import com.courseflow.modules.dto.ModuleRequestNew;
import com.courseflow.modules.dto.ModuleResponseNew;
import com.courseflow.modules.service.ModuleServiceNew;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for module endpoints (Canvas-like structure).
 */
@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
@Tag(name = "Modules", description = "Course module management endpoints")
public class ModuleControllerNew {

    private final ModuleServiceNew moduleService;

    @GetMapping("/{courseId}/modules")
    @Operation(summary = "Get course modules", description = "Get all modules for a course with their items. User must be enrolled.")
    public ResponseEntity<ApiResponse<ModuleResponseNew.ModulesResponse>> getModules(
            @PathVariable String courseId) {
        ModuleResponseNew.ModulesResponse modules = moduleService.getModules(courseId);
        return ResponseEntity.ok(ApiResponse.success(modules));
    }

    @PostMapping("/{courseId}/modules")
    @RequireInstructor
    @Operation(summary = "Create module", description = "Create a new module. Only instructors and TAs can create modules.")
    public ResponseEntity<ApiResponse<ModuleResponseNew.ModuleDto>> createModule(
            @PathVariable String courseId,
            @Valid @RequestBody ModuleRequestNew.CreateModuleRequest request) {
        ModuleResponseNew.ModuleDto module = moduleService.createModule(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(module, "Module created successfully"));
    }

    @PatchMapping("/modules/{moduleId}")
    @Operation(summary = "Update module", description = "Update a module. Only instructors and TAs can update modules.")
    public ResponseEntity<ApiResponse<ModuleResponseNew.ModuleDto>> updateModule(
            @PathVariable String moduleId,
            @Valid @RequestBody ModuleRequestNew.UpdateModuleRequest request) {
        ModuleResponseNew.ModuleDto module = moduleService.updateModule(moduleId, request);
        return ResponseEntity.ok(ApiResponse.success(module, "Module updated successfully"));
    }

    @DeleteMapping("/modules/{moduleId}")
    @Operation(summary = "Delete module", description = "Delete a module. Only instructors and TAs can delete modules.")
    public ResponseEntity<ApiResponse<Void>> deleteModule(
            @PathVariable String moduleId) {
        moduleService.deleteModule(moduleId);
        return ResponseEntity.ok(ApiResponse.success(null, "Module deleted successfully"));
    }

    @PostMapping("/modules/{moduleId}/items")
    @Operation(summary = "Create module item", description = "Create a new item in a module. Only instructors and TAs can create module items.")
    public ResponseEntity<ApiResponse<ModuleResponseNew.ModuleItemDto>> createModuleItem(
            @PathVariable String moduleId,
            @Valid @RequestBody ModuleRequestNew.CreateModuleItemRequest request) {
        ModuleResponseNew.ModuleItemDto item = moduleService.createModuleItem(moduleId, request);
        return ResponseEntity.ok(ApiResponse.success(item, "Module item created successfully"));
    }

    @PatchMapping("/module-items/{itemId}")
    @Operation(summary = "Update module item", description = "Update a module item. Only instructors and TAs can update module items.")
    public ResponseEntity<ApiResponse<ModuleResponseNew.ModuleItemDto>> updateModuleItem(
            @PathVariable String itemId,
            @Valid @RequestBody ModuleRequestNew.UpdateModuleItemRequest request) {
        ModuleResponseNew.ModuleItemDto item = moduleService.updateModuleItem(itemId, request);
        return ResponseEntity.ok(ApiResponse.success(item, "Module item updated successfully"));
    }

    @DeleteMapping("/module-items/{itemId}")
    @Operation(summary = "Delete module item", description = "Delete a module item. Only instructors and TAs can delete module items.")
    public ResponseEntity<ApiResponse<Void>> deleteModuleItem(
            @PathVariable String itemId) {
        moduleService.deleteModuleItem(itemId);
        return ResponseEntity.ok(ApiResponse.success(null, "Module item deleted successfully"));
    }

    @PostMapping("/{courseId}/modules/reorder")
    @RequireInstructor
    @Operation(summary = "Reorder modules and items", description = "Reorder modules and items within modules. Only instructors and TAs can reorder.")
    public ResponseEntity<ApiResponse<ModuleResponseNew.ModulesResponse>> reorderModules(
            @PathVariable String courseId,
            @Valid @RequestBody ModuleRequestNew.ReorderRequest request) {
        ModuleResponseNew.ModulesResponse modules = moduleService.reorderModules(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(modules, "Modules reordered successfully"));
    }
}
