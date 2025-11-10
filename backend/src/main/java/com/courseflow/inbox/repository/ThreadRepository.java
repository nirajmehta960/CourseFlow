package com.courseflow.inbox.repository;

import com.courseflow.inbox.model.Thread;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Thread entity operations.
 */
@Repository
public interface ThreadRepository extends MongoRepository<Thread, String> {
    
    /**
     * Find all threads where the user is a participant, ordered by last message time (newest first).
     * 
     * @param userId The user ID
     * @return List of threads
     */
    List<Thread> findByParticipantIdsContainingOrderByLastMessageAtDesc(String userId);
    
    /**
     * Find all threads for a course, ordered by last message time (newest first).
     * 
     * @param courseId The course ID
     * @return List of threads
     */
    List<Thread> findByCourseIdOrderByLastMessageAtDesc(String courseId);
    
    /**
     * Find all threads for a course where the user is a participant.
     * 
     * @param courseId The course ID
     * @param userId The user ID
     * @return List of threads
     */
    List<Thread> findByCourseIdAndParticipantIdsContainingOrderByLastMessageAtDesc(String courseId, String userId);
    
    /**
     * Find all direct message threads (no courseId) where the user is a participant.
     * 
     * @param userId The user ID
     * @return List of threads
     */
    List<Thread> findByCourseIdIsNullAndParticipantIdsContainingOrderByLastMessageAtDesc(String userId);
}
