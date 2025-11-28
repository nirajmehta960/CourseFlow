package com.courseflow.modules.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * ModuleItem entity representing an item within a module.
 * Separate document for each item (Canvas-like structure).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "module_items")
@CompoundIndex(name = "module_position_idx", def = "{'moduleId': 1, 'position': 1}")
public class ModuleItem {
    
    @Id
    private String id;
    
    @Indexed
    private String moduleId;
    
    @Indexed
    private String courseId;
    
    /**
     * Type of the item: PAGE, ASSIGNMENT, QUIZ, FILE, URL
     */
    private ItemType type;
    
    private String title;
    
    /**
     * Reference to the actual content (assignment ID, quiz ID, etc.)
     * Used for ASSIGNMENT and QUIZ types.
     */
    private String contentRefId;
    
    /**
     * URL for the item (for PAGE, FILE, URL types).
     */
    private String url;
    
    private Integer position;
    
    @Builder.Default
    private Boolean published = false;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
    
    /**
     * Item types supported in modules.
     */
    public enum ItemType {
        PAGE,
        ASSIGNMENT,
        QUIZ,
        FILE,
        URL
    }
}
