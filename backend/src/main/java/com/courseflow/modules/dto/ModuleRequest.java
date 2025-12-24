package com.courseflow.modules.dto;

import com.courseflow.modules.model.CourseModule;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Request DTO for module operations.
 */
public class ModuleRequest {
    
    /**
     * Request for updating the entire module tree.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateModulesRequest {
        @Valid
        private List<ModuleDto> modules;
    }
    
    /**
     * Request for adding a new module.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddModuleRequest {
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        private String title;
        
        @NotNull(message = "Position is required")
        private Integer position;
    }
    
    /**
     * Request for adding a new item to a module.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddModuleItemRequest {
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        private String title;
        
        @NotNull(message = "Type is required")
        private CourseModule.ModuleItem.ItemType type;
        
        private String url;
        
        private Instant dueDate;
        
        private Boolean published;
    }
    
    /**
     * Module DTO for nested structure.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleDto {
        @NotBlank(message = "Module ID is required")
        private String moduleId;
        
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        private String title;
        
        @NotNull(message = "Position is required")
        private Integer position;
        
        @Valid
        @Builder.Default
        private List<ModuleItemDto> items = new java.util.ArrayList<>();
    }
    
    /**
     * Module item DTO for nested structure.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleItemDto {
        @NotBlank(message = "Item ID is required")
        private String itemId;
        
        @NotNull(message = "Type is required")
        private CourseModule.ModuleItem.ItemType type;
        
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        private String title;
        
        private String url;
        
        private Instant dueDate;
        
        @Builder.Default
        private Boolean published = false;
    }
}


