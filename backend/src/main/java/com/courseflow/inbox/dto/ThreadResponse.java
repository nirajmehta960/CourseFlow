package com.courseflow.inbox.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for thread data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThreadResponse {
    
    private String id;
    private String courseId;
    private List<String> participantIds;
    private Instant lastMessageAt;
    private String title;
    
    /**
     * Whether this thread has unread messages for the current user.
     */
    private Boolean hasUnread;
    
    /**
     * Preview of the last message in the thread.
     */
    private String lastMessagePreview;
}
