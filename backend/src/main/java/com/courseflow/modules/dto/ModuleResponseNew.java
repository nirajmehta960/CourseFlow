package com.courseflow.modules.dto;

import com.courseflow.modules.model.Module;
import com.courseflow.modules.model.ModuleItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Response DTOs for module operations (Canvas-like structure).
 */
public class ModuleResponseNew {
    
    /**
     * Response containing list of modules with their items.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModulesResponse {
        private List<ModuleDto> modules;
    }
    
    /**
     * Module DTO for response.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleDto {
        private String id;
        private String courseId;
        private String title;
        private Integer position;
        private Boolean published;
        private Instant unlockAt;
        private Instant createdAt;
        private Instant updatedAt;
        private List<ModuleItemDto> items;
    }
    
    /**
     * Module item DTO for response.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleItemDto {
        private String id;
        private String moduleId;
        private String courseId;
        private ModuleItem.ItemType type;
        private String title;
        private String contentRefId;
        private String url;
        private Integer position;
        private Boolean published;
        private Instant createdAt;
        private Instant updatedAt;
    }
    
    /**
     * Map Module entity to ModuleDto.
     */
    public static ModuleDto fromEntity(Module module, List<ModuleItem> items) {
        List<ModuleItemDto> itemDtos = items.stream()
                .map(ModuleResponseNew::fromEntity)
                .toList();
        
        return ModuleDto.builder()
                .id(module.getId())
                .courseId(module.getCourseId())
                .title(module.getTitle())
                .position(module.getPosition())
                .published(module.getPublished())
                .unlockAt(module.getUnlockAt())
                .createdAt(module.getCreatedAt())
                .updatedAt(module.getUpdatedAt())
                .items(itemDtos)
                .build();
    }
    
    /**
     * Map ModuleItem entity to ModuleItemDto.
     */
    public static ModuleItemDto fromEntity(ModuleItem item) {
        return ModuleItemDto.builder()
                .id(item.getId())
                .moduleId(item.getModuleId())
                .courseId(item.getCourseId())
                .type(item.getType())
                .title(item.getTitle())
                .contentRefId(item.getContentRefId())
                .url(item.getUrl())
                .position(item.getPosition())
                .published(item.getPublished())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
