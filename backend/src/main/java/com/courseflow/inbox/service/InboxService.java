package com.courseflow.inbox.service;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.common.service.RealtimeService;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.inbox.dto.MessageRequest;
import com.courseflow.inbox.dto.MessageResponse;
import com.courseflow.inbox.dto.ThreadRequest;
import com.courseflow.inbox.dto.ThreadResponse;
import com.courseflow.inbox.model.Message;
import com.courseflow.inbox.model.Thread;
import com.courseflow.inbox.repository.MessageRepository;
import com.courseflow.inbox.repository.ThreadRepository;
import com.courseflow.notifications.model.Notification;
import com.courseflow.notifications.service.NotificationService;
import com.courseflow.users.model.User;
import com.courseflow.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.bson.types.ObjectId;
import java.util.stream.Collectors;

/**
 * Service for handling inbox operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InboxService {

    private final ThreadRepository threadRepository;
    private final MessageRepository messageRepository;
    private final AuthService authService;
    private final EnrollmentService enrollmentService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final RealtimeService realtimeService;

    /**
     * Get threads for the current user with optional filters.
     * 
     * @param filter   Filter type: "all", "unread", or "starred" (default: "all")
     * @param search   Search term for filtering threads (optional)
     * @param courseId Optional course ID to filter by course
     * @return List of thread responses
     */
    public List<ThreadResponse> getThreads(String filter, String search, String courseId) {
        try {
            User currentUser = authService.getCurrentUser();
            String userId = currentUser.getId();

            // Get threads for the user
            List<Thread> threads;
            if (courseId != null && !courseId.isBlank()) {
                // Verify enrollment if filtering by course
                enrollmentService.verifyEnrollment(courseId, userId);
                threads = threadRepository.findByCourseIdAndParticipantIdsContainingOrderByLastMessageAtDesc(
                        courseId, userId);
            } else {
                // Get all threads (course and direct messages)
                threads = threadRepository.findByParticipantIdsContainingOrderByLastMessageAtDesc(userId);
            }

            // Map to response
            List<ThreadResponse> responses = threads.stream()
                    .map(thread -> mapToThreadResponse(thread, userId))
                    .collect(Collectors.toList());

            // Filter by unread/starred if specified
            if ("unread".equals(filter)) {
                responses = responses.stream()
                        .filter(ThreadResponse::getHasUnread)
                        .collect(Collectors.toList());
            } else if ("starred".equals(filter)) {
                // Get all messages for threads and check if any are starred
                responses = responses.stream()
                        .filter(thread -> {
                            List<Message> starredMessages = messageRepository
                                    .findByThreadIdAndStarredByContainingOrderByCreatedAtDesc(
                                            thread.getId(), userId);
                            return !starredMessages.isEmpty();
                        })
                        .collect(Collectors.toList());
            }

            // Apply search filter if provided
            if (StringUtils.hasText(search)) {
                String searchLower = search.toLowerCase();
                responses = responses.stream()
                        .filter(thread -> {
                            // Search in title
                            if (thread.getTitle() != null &&
                                    thread.getTitle().toLowerCase().contains(searchLower)) {
                                return true;
                            }
                            // Search in last message preview
                            if (thread.getLastMessagePreview() != null &&
                                    thread.getLastMessagePreview().toLowerCase().contains(searchLower)) {
                                return true;
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
            }

            // Sort by last message time (newest first)
            responses.sort(Comparator.comparing(ThreadResponse::getLastMessageAt,
                    Comparator.nullsLast(Comparator.reverseOrder())));

            return responses;
        } catch (Exception e) {
            log.error("Error fetching threads: ", e);
            throw e;
        }
    }

    /**
     * Get a thread by ID.
     * 
     * @param threadId Thread ID
     * @return Thread response
     */
    public ThreadResponse getThread(String threadId) {
        User currentUser = authService.getCurrentUser();
        String userId = currentUser.getId();

        // Verify thread exists and user is a participant
        Thread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ApiException("THREAD_NOT_FOUND", "Thread not found", 404));

        if (!thread.getParticipantIds().contains(userId)) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "You are not a participant in this thread", 403);
        }

        return mapToThreadResponse(thread, userId);
    }

    /**
     * Create a new thread.
     * 
     * @param request Thread creation request
     * @return Created thread response
     */
    public ThreadResponse createThread(ThreadRequest request) {
        User currentUser = authService.getCurrentUser();
        String userId = currentUser.getId();

        // Ensure current user is in participant list
        List<String> participantIds = new ArrayList<>(request.getParticipantIds());
        if (!participantIds.contains(userId)) {
            participantIds.add(userId);
        }

        // If course ID is provided, verify enrollment
        if (request.getCourseId() != null && !request.getCourseId().isBlank()) {
            enrollmentService.verifyEnrollment(request.getCourseId(), userId);

            // Verify all participants are enrolled in the course
            for (String participantId : participantIds) {
                if (!participantId.equals(userId)) {
                    enrollmentService.verifyEnrollment(request.getCourseId(), participantId);
                }
            }
        }

        // Create thread
        Thread thread = Thread.builder()
                .id(new ObjectId().toHexString())
                .courseId(request.getCourseId())
                .participantIds(participantIds)
                .title(request.getTitle())
                .lastMessageAt(Instant.now())
                .build();

        thread = threadRepository.save(thread);
        log.info("Thread created: {} by user {}", thread.getId(), userId);

        return mapToThreadResponse(thread, userId);
    }

    /**
     * Get all messages for a thread.
     * 
     * @param threadId Thread ID
     * @return List of message responses
     */
    public List<MessageResponse> getMessages(String threadId) {
        User currentUser = authService.getCurrentUser();
        String userId = currentUser.getId();

        // Verify thread exists and user is a participant
        Thread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ApiException("THREAD_NOT_FOUND", "Thread not found", 404));

        if (!thread.getParticipantIds().contains(userId)) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "You are not a participant in this thread", 403);
        }

        // Get messages for the thread
        List<Message> messages = messageRepository.findByThreadIdOrderByCreatedAtAscIdAsc(threadId);

        return messages.stream()
                .map(msg -> mapToMessageResponse(msg, userId))
                .collect(Collectors.toList());
    }

    /**
     * Send a message in a thread.
     * 
     * @param threadId Thread ID
     * @param request  Message request
     * @return Created message response
     */
    public MessageResponse sendMessage(String threadId, MessageRequest request) {
        User currentUser = authService.getCurrentUser();
        String userId = currentUser.getId();

        // Verify thread exists and user is a participant
        Thread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ApiException("THREAD_NOT_FOUND", "Thread not found", 404));

        if (!thread.getParticipantIds().contains(userId)) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "You are not a participant in this thread", 403);
        }

        // Create message
        Message message = Message.builder()
                .id(new ObjectId().toHexString())
                .threadId(threadId)
                .senderId(userId)
                .body(request.getBody())
                .readBy(new ArrayList<>())
                .starredBy(new ArrayList<>())
                .attachments(request.getAttachments() != null ? request.getAttachments() : new ArrayList<>())
                .build();

        // Add sender to readBy (they've seen their own message)
        message.getReadBy().add(userId);

        message = messageRepository.save(message);
        log.info("Message sent: {} in thread {} by user {}", message.getId(), threadId, userId);

        // Update thread's lastMessageAt
        thread.setLastMessageAt(Instant.now());
        threadRepository.save(thread);

        MessageResponse messageResponse = mapToMessageResponse(message, userId);

        // Notify other participants and push real-time message to all participants
        // (including sender)
        for (String participantId : thread.getParticipantIds()) {
            if (!participantId.equals(userId)) {
                notificationService.notifyUser(
                        participantId,
                        Notification.NotificationType.INBOX_MESSAGE,
                        "New Message: " + thread.getTitle(),
                        "You have a new message in " + thread.getTitle(),
                        "/inbox?thread=" + threadId,
                        thread.getCourseId());
            }
            // Push real-time message so conversation list refreshes for sender and
            // recipients
            realtimeService.sendMessage(participantId, mapToMessageResponse(message, participantId));
        }

        return messageResponse;
    }

    /**
     * Toggle star status of a message.
     * 
     * @param messageId Message ID
     * @return Updated message response
     */
    public MessageResponse toggleStar(String messageId) {
        User currentUser = authService.getCurrentUser();
        String userId = currentUser.getId();

        // Get message
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ApiException("MESSAGE_NOT_FOUND", "Message not found", 404));

        // Verify user is a participant in the thread
        Thread thread = threadRepository.findById(message.getThreadId())
                .orElseThrow(() -> new ApiException("THREAD_NOT_FOUND", "Thread not found", 404));

        if (!thread.getParticipantIds().contains(userId)) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "You are not a participant in this thread", 403);
        }

        // Toggle star
        if (message.getStarredBy().contains(userId)) {
            message.getStarredBy().remove(userId);
        } else {
            message.getStarredBy().add(userId);
        }

        message = messageRepository.save(message);
        log.debug("Message star toggled: {} by user {}", messageId, userId);

        return mapToMessageResponse(message, userId);
    }

    /**
     * Mark all messages in a thread as read for the current user.
     * 
     * @param threadId Thread ID
     */
    public void markThreadRead(String threadId) {
        User currentUser = authService.getCurrentUser();
        String userId = currentUser.getId();

        // Verify thread exists and user is a participant
        Thread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ApiException("THREAD_NOT_FOUND", "Thread not found", 404));

        if (!thread.getParticipantIds().contains(userId)) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "You are not a participant in this thread", 403);
        }

        // Get all messages in the thread
        List<Message> messages = messageRepository.findByThreadIdOrderByCreatedAtAscIdAsc(threadId);

        // Mark all unread messages as read
        boolean updated = false;
        for (Message message : messages) {
            if (!message.getReadBy().contains(userId)) {
                message.getReadBy().add(userId);
                messageRepository.save(message);
                updated = true;
            }
        }

        if (updated) {
            log.debug("Thread marked as read: {} by user {}", threadId, userId);
        }
    }

    /**
     * Map Thread entity to ThreadResponse DTO.
     */
    private ThreadResponse mapToThreadResponse(Thread thread, String currentUserId) {
        // Check if thread has unread messages
        long unreadCount = messageRepository.countByThreadIdAndReadByNotContaining(
                thread.getId(), currentUserId);
        boolean hasUnread = unreadCount > 0;

        // Get last message preview (explicit latest-by-createdAt to avoid ordering
        // issues)
        String lastMessagePreview = messageRepository
                .findFirstByThreadIdOrderByCreatedAtDesc(thread.getId())
                .map(Message::getBody)
                .map(body -> body != null && body.length() > 100 ? body.substring(0, 97) + "..." : body)
                .orElse(null);

        // Fetch participant names
        List<String> participantNames = new ArrayList<>();
        List<String> otherParticipantIds = thread.getParticipantIds().stream()
                .filter(id -> !id.equals(currentUserId))
                .collect(Collectors.toList());

        if (!otherParticipantIds.isEmpty()) {
            List<User> users = (List<User>) userRepository.findAllById(otherParticipantIds);
            participantNames = users.stream()
                    .map(User::getName)
                    .collect(Collectors.toList());
        } else {
            // If it's just me (note to self), use "Me" or my name
            participantNames.add("Me");
        }

        return ThreadResponse.builder()
                .id(thread.getId())
                .courseId(thread.getCourseId())
                .participantIds(new ArrayList<>(thread.getParticipantIds()))
                .participantNames(participantNames)
                .lastMessageAt(thread.getLastMessageAt())
                .title(thread.getTitle())
                .hasUnread(hasUnread)
                .lastMessagePreview(lastMessagePreview)
                .build();
    }

    /**
     * Map Message entity to MessageResponse DTO.
     */
    private MessageResponse mapToMessageResponse(Message message, String currentUserId) {
        boolean isRead = message.getReadBy().contains(currentUserId);
        boolean isStarred = message.getStarredBy().contains(currentUserId);

        String senderName = "Unknown User";
        try {
            User sender = userRepository.findById(message.getSenderId()).orElse(null);
            if (sender != null) {
                senderName = sender.getName();
            }
        } catch (Exception e) {
            log.error("Error fetching sender name: ", e);
        }

        return MessageResponse.builder()
                .id(message.getId())
                .threadId(message.getThreadId())
                .senderId(message.getSenderId())
                .senderName(senderName)
                .body(message.getBody())
                .createdAt(message.getCreatedAt())
                .readBy(new ArrayList<>(message.getReadBy()))
                .starredBy(new ArrayList<>(message.getStarredBy()))
                .isRead(isRead)
                .isStarred(isStarred)
                .attachments(message.getAttachments() != null ? message.getAttachments() : new ArrayList<>())
                .build();
    }
}
