package com.courseflow.inbox.model;

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
import java.util.ArrayList;
import java.util.List;

/**
 * Message entity representing a message in a thread.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
@CompoundIndex(name = "thread_created_idx", def = "{'threadId': 1, 'createdAt': -1}")
public class Message {
    
    @Id
    private String id;
    
    /**
     * ID of the thread this message belongs to.
     */
    @Indexed
    private String threadId;
    
    /**
     * ID of the user who sent this message.
     */
    @Indexed
    private String senderId;
    
    /**
     * Message body/content.
     */
    private String body;
    
    @CreatedDate
    private Instant createdAt;
    
    /**
     * Array of user IDs who have read this message.
     */
    @Builder.Default
    private List<String> readBy = new ArrayList<>();
    
    /**
     * Array of user IDs who have starred this message.
     */
    @Builder.Default
    private List<String> starredBy = new ArrayList<>();
}
