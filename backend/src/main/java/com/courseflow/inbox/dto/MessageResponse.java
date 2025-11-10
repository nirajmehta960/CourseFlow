package com.courseflow.inbox.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for message data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    
    private String id;
    private String threadId;
    private String senderId;
    private String body;
    private Instant createdAt;
    private List<String> readBy;
    private List<String> starredBy;
    
    /**
     * Whether this message has been read by the current user.
     */
    private Boolean isRead;
    
    /**
     * Whether this message is starred by the current user.
     */
    private Boolean isStarred;
}
