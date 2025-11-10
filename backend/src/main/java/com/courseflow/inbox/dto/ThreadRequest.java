package com.courseflow.inbox.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for creating threads.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThreadRequest {
    
    /**
     * Course ID if this is a course discussion thread (optional, null for direct messages).
     */
    private String courseId;
    
    /**
     * Array of user IDs participating in this thread (must include current user).
     */
    @NotEmpty(message = "At least one participant is required")
    @Builder.Default
    private List<String> participantIds = new ArrayList<>();
    
    /**
     * Title/subject of the thread (optional, for course discussions).
     */
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;
}
