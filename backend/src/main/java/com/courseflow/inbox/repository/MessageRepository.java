package com.courseflow.inbox.repository;

import com.courseflow.inbox.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Message entity operations.
 */
@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    /**
     * Find all messages for a thread, ordered by creation time (oldest first for
     * conversation flow).
     * 
     * @param threadId The thread ID
     * @return List of messages
     */
    List<Message> findByThreadIdOrderByCreatedAtAscIdAsc(String threadId);

    /**
     * Find the most recent message in a thread (for conversation list preview).
     *
     * @param threadId The thread ID
     * @return Optional of the latest message
     */
    Optional<Message> findFirstByThreadIdOrderByCreatedAtDesc(String threadId);

    /**
     * Count unread messages in a thread for a specific user.
     * A message is unread if the user is a participant but not in readBy list.
     * 
     * @param threadId The thread ID
     * @param userId   The user ID (must be excluded from readBy)
     * @return Count of unread messages
     */
    long countByThreadIdAndReadByNotContaining(String threadId, String userId);

    /**
     * Find messages in a thread that are starred by a specific user.
     * 
     * @param threadId The thread ID
     * @param userId   The user ID
     * @return List of starred messages
     */
    List<Message> findByThreadIdAndStarredByContainingOrderByCreatedAtDesc(String threadId, String userId);

    /**
     * Find a message by ID.
     * 
     * @param messageId The message ID
     * @return Optional message
     */
    Optional<Message> findById(String messageId);
}
