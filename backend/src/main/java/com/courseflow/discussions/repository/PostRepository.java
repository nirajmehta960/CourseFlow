package com.courseflow.discussions.repository;

import com.courseflow.discussions.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Post entity operations.
 */
@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    
    /**
     * Find all posts for a discussion, ordered by creation date (oldest first for threading).
     * 
     * @param discussionId The discussion ID
     * @return List of posts for the discussion
     */
    List<Post> findByDiscussionIdOrderByCreatedAtAsc(String discussionId);
    
    /**
     * Find all non-deleted posts for a discussion.
     * 
     * @param discussionId The discussion ID
     * @return List of non-deleted posts
     */
    List<Post> findByDiscussionIdAndDeletedFalseOrderByCreatedAtAsc(String discussionId);
    
    /**
     * Find all replies to a specific post.
     * 
     * @param parentPostId The parent post ID
     * @return List of reply posts
     */
    List<Post> findByParentPostIdAndDeletedFalseOrderByCreatedAtAsc(String parentPostId);
    
    /**
     * Find a post by ID.
     * 
     * @param postId The post ID
     * @return Optional post if found
     */
    Optional<Post> findByIdAndDeletedFalse(String postId);
    
    /**
     * Count posts in a discussion.
     * 
     * @param discussionId The discussion ID
     * @return Number of non-deleted posts
     */
    long countByDiscussionIdAndDeletedFalse(String discussionId);
}
