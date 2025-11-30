package com.courseflow.notifications.repository;

import com.courseflow.notifications.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Notification entity operations.
 */
@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    
    /**
     * Find all notifications for a user, ordered by creation date (newest first).
     * 
     * @param userId The user ID
     * @return List of notifications for the user
     */
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    
    /**
     * Find unread notifications for a user.
     * 
     * @param userId The user ID
     * @return List of unread notifications
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);
    
    /**
     * Count unread notifications for a user.
     * 
     * @param userId The user ID
     * @return Number of unread notifications
     */
    long countByUserIdAndIsReadFalse(String userId);
}
