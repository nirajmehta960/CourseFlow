package com.courseflow.discussions.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for discussion data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionResponse {

    private String id;
    private String courseId;
    private String title;
    private String bodyHtml;
    private Boolean published;
    private String createdBy;
    private String authorName;
    private Instant createdAt;
    private Instant updatedAt;
    private Long postCount;
    private List<PostResponse> posts;
}
