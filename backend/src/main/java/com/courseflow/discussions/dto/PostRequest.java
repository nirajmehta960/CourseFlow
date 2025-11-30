package com.courseflow.discussions.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating/updating a post.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostRequest {
    
    @NotBlank(message = "Body is required")
    private String bodyHtml;
    
    /**
     * Parent post ID if this is a reply (null for top-level posts).
     */
    private String parentPostId;
}
