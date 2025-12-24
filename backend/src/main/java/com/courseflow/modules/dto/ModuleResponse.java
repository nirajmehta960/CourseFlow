package com.courseflow.modules.dto;

import com.courseflow.modules.model.CourseModule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Response DTO for module endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleResponse {
    
    private String courseId;
    private List<ModuleDto> modules;
    private Instant updatedAt;
    
    /**
     * Module DTO for response.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleDto {
        private String moduleId;
        private String title;
        private Integer position;
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
        private String itemId;
        private CourseModule.ModuleItem.ItemType type;
        private String title;
        private String url;
        private Instant dueDate;
        private Boolean published;
    }
    
    /**
     * Map CourseModule entity to ModuleResponse DTO.
     */
    public static ModuleResponse fromEntity(CourseModule courseModule) {
        List<ModuleDto> moduleDtos = courseModule.getModules().stream()
                .map(module -> ModuleDto.builder()
                        .moduleId(module.getModuleId())
                        .title(module.getTitle())
                        .position(module.getPosition())
                        .items(module.getItems().stream()
                                .map(item -> ModuleItemDto.builder()
                                        .itemId(item.getItemId())
                                        .type(item.getType())
                                        .title(item.getTitle())
                                        .url(item.getUrl())
                                        .dueDate(item.getDueDate())
                                        .published(item.getPublished())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
        
        return ModuleResponse.builder()
                .courseId(courseModule.getCourseId())
                .modules(moduleDtos)
                .updatedAt(courseModule.getUpdatedAt())
                .build();
    }
}


