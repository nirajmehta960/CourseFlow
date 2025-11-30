package com.courseflow.discussions.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for post data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostResponse {
    
    private String id;
    private String discussionId;
    private String userId;
    private String bodyHtml;
    private String parentPostId;
    private Boolean deleted;
    private Instant createdAt;
    private Instant updatedAt;
    private List<PostResponse> replies; // Nested replies (1 level for MVP)
}
