package com.courseflow.discussions.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating/updating a discussion.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Body is required")
    private String bodyHtml;
    
    private Boolean published;
}
