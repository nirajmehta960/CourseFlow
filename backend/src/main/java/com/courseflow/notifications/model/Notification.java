package com.courseflow.notifications.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Notification entity representing a user notification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
@CompoundIndex(name = "user_created_idx", def = "{'userId': 1, 'createdAt': -1}")
public class Notification {
    
    @Id
    private String id;
    
    /**
     * ID of the user who should receive this notification.
     */
    @Indexed
    private String userId;
    
    /**
     * Type of notification.
     */
    private NotificationType type;
    
    private String title;
    
    private String body;
    
    /**
     * Link to the relevant resource (e.g., /courses/{courseId}/assignments/{assignmentId}).
     */
    private String link;
    
    @Builder.Default
    private Boolean isRead = false;
    
    @CreatedDate
    private Instant createdAt;
    
    /**
     * Notification type enumeration.
     */
    public enum NotificationType {
        NEW_ASSIGNMENT,
        NEW_QUIZ,
        GRADE_POSTED,
        DISCUSSION_REPLY,
        INBOX_MESSAGE
    }
}
