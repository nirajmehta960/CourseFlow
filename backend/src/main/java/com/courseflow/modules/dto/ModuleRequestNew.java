package com.courseflow.modules.dto;

import com.courseflow.modules.model.ModuleItem;
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
 * Request DTOs for module operations (Canvas-like structure).
 */
public class ModuleRequestNew {
    
    /**
     * Request for creating a new module.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateModuleRequest {
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        private String title;
        
        private Integer position;
        
        private Boolean published;
        
        private Instant unlockAt;
    }
    
    /**
     * Request for updating a module.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateModuleRequest {
        private String title;
        
        private Integer position;
        
        private Boolean published;
        
        private Instant unlockAt;
    }
    
    /**
     * Request for creating a new module item.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateModuleItemRequest {
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        private String title;
        
        @NotNull(message = "Type is required")
        private ModuleItem.ItemType type;
        
        private String contentRefId;
        
        private String url;
        
        private Integer position;
        
        private Boolean published;
    }
    
    /**
     * Request for updating a module item.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateModuleItemRequest {
        private String title;
        
        private Integer position;
        
        private Boolean published;
        
        private String contentRefId;
        
        private String url;
    }
    
    /**
     * Request for reordering modules and items.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReorderRequest {
        /**
         * Array of module IDs in the desired order.
         */
        private List<String> moduleOrder;
        
        /**
         * Map of module ID to array of item IDs in the desired order.
         */
        private java.util.Map<String, List<String>> itemOrders;
    }
}
