package com.courseflow.discussions.repository;

import com.courseflow.discussions.model.Discussion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Discussion entity operations.
 */
@Repository
public interface DiscussionRepository extends MongoRepository<Discussion, String> {
    
    /**
     * Find all discussions for a course, ordered by creation date (newest first).
     * 
     * @param courseId The course ID
     * @return List of discussions for the course
     */
    List<Discussion> findByCourseIdOrderByCreatedAtDesc(String courseId);
    
    /**
     * Find all published discussions for a course.
     * 
     * @param courseId The course ID
     * @param published Published status
     * @return List of published discussions
     */
    List<Discussion> findByCourseIdAndPublishedOrderByCreatedAtDesc(String courseId, Boolean published);
    
    /**
     * Check if a discussion exists in a course.
     * 
     * @param courseId The course ID
     * @param discussionId The discussion ID
     * @return true if discussion exists in the course, false otherwise
     */
    boolean existsByIdAndCourseId(String discussionId, String courseId);
}
