package com.courseflow.modules.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * CourseModule entity representing the module tree for a course.
 * Single document per course containing all modules and their items.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "course_modules")
public class CourseModule {
    
    @Id
    private String id;
    
    /**
     * Course ID this module structure belongs to.
     * Unique index ensures one document per course.
     */
    @Indexed(unique = true)
    private String courseId;
    
    /**
     * Array of modules for this course.
     */
    @Builder.Default
    private List<Module> modules = new ArrayList<>();
    
    @LastModifiedDate
    private Instant updatedAt;
    
    /**
     * Module entity representing a module within a course.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Module {
        /**
         * Unique identifier for this module within the course.
         */
        private String moduleId;
        
        /**
         * Title of the module.
         */
        private String title;
        
        /**
         * Position/order of the module (for sorting).
         */
        private Integer position;
        
        /**
         * Array of items within this module.
         */
        @Builder.Default
        private List<ModuleItem> items = new ArrayList<>();
    }
    
    /**
     * ModuleItem entity representing an item within a module.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleItem {
        /**
         * Unique identifier for this item within the module.
         */
        private String itemId;
        
        /**
         * Type of the item.
         */
        private ItemType type;
        
        /**
         * Title of the item.
         */
        private String title;
        
        /**
         * URL for the item (for VIDEO, DOC, LINK types).
         */
        private String url;
        
        /**
         * Due date for the item (for ASSIGNMENT, QUIZ types).
         */
        private Instant dueDate;
        
        /**
         * Whether the item is published (visible to students).
         */
        @Builder.Default
        private Boolean published = false;
        
        /**
         * Item types supported in modules.
         */
        public enum ItemType {
            VIDEO,
            DOC,
            LINK,
            ASSIGNMENT,
            QUIZ
        }
    }
}


