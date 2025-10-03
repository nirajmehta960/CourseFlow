package com.courseflow.courses.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating and updating courses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRequest {
    
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;
    
    @NotBlank(message = "Code is required")
    @Size(max = 20, message = "Code must be at most 20 characters")
    private String code;
    
    @NotBlank(message = "Term is required")
    @Size(max = 50, message = "Term must be at most 50 characters")
    private String term;
    
    @NotBlank(message = "Section is required")
    @Size(max = 20, message = "Section must be at most 20 characters")
    private String section;
    
    private Boolean published;
}

