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
 * Module entity representing a module in a course.
 * Separate document for each module (Canvas-like structure).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "modules")
@CompoundIndex(name = "course_position_idx", def = "{'courseId': 1, 'position': 1}")
public class Module {
    
    @Id
    private String id;
    
    @Indexed
    private String courseId;
    
    private String title;
    
    private Integer position;
    
    @Builder.Default
    private Boolean published = false;
    
    private Instant unlockAt;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
}
