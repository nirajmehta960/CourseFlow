package com.courseflow.discussions.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Post entity representing a reply/post in a discussion.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "posts")
@CompoundIndex(name = "discussion_created_idx", def = "{'discussionId': 1, 'createdAt': 1}")
public class Post {
    
    @Id
    private String id;
    
    @Indexed
    private String discussionId;
    
    /**
     * ID of the user who created this post.
     */
    @Indexed
    private String userId;
    
    /**
     * Rich text body content as HTML.
     */
    private String bodyHtml;
    
    /**
     * ID of the parent post if this is a reply (null for top-level posts).
     */
    @Indexed
    private String parentPostId;
    
    /**
     * Whether this post has been deleted (soft delete).
     */
    @Builder.Default
    private Boolean deleted = false;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
}
