package com.courseflow.inbox.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Thread entity representing a conversation thread.
 * Can be a course discussion or a direct message between users.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "threads")
public class Thread {
    
    @Id
    private String id;
    
    /**
     * Course ID if this is a course discussion thread (null for direct messages).
     */
    @Indexed
    private String courseId;
    
    /**
     * Array of user IDs participating in this thread.
     */
    @Indexed
    @Builder.Default
    private List<String> participantIds = new ArrayList<>();
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
    
    /**
     * Timestamp of the last message in this thread.
     */
    private Instant lastMessageAt;
    
    /**
     * Title/subject of the thread (optional, for course discussions).
     */
    private String title;
}
