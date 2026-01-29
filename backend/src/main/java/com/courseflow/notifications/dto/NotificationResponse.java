package com.courseflow.notifications.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response DTO for notification data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private String id;
    private String userId;
    private String type; // "NEW_ASSIGNMENT", "NEW_QUIZ", "GRADE_POSTED", "DISCUSSION_REPLY",
                         // "INBOX_MESSAGE"
    private String title;
    private String body;
    private String link;
    private String courseId;
    private Boolean isRead;
    private Instant createdAt;
}
