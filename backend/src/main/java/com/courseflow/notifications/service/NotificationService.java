package com.courseflow.notifications.service;

import com.courseflow.common.error.ApiException;
import com.courseflow.enrollments.repository.EnrollmentRepository;
import com.courseflow.common.service.RealtimeService;
import com.courseflow.notifications.dto.NotificationResponse;
import com.courseflow.notifications.model.Notification;
import com.courseflow.config.RedisConfig;
import com.courseflow.notifications.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for handling notification operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final RealtimeService realtimeService;

    /**
     * Get all notifications for a user.
     * 
     * @param userId The user ID
     * @return List of notification responses
     */
    public List<NotificationResponse> getNotifications(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notifications for a user.
     * 
     * @param userId The user ID
     * @return List of unread notification responses
     */
    public List<NotificationResponse> getUnreadNotifications(String userId) {
        List<Notification> notifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notification count for a user.
     *
     * @param userId The user ID
     * @return Number of unread notifications
     */
    @Cacheable(cacheNames = RedisConfig.CACHE_NOTIFICATION_UNREAD_COUNT, key = "#userId")
    public long getUnreadCount(String userId) {
        // Fallback to fetch-and-count to avoid potential issue with strict countBy
        // derivation
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId).size();
    }

    /**
     * Mark a notification as read.
     *
     * @param userId         The user ID
     * @param notificationId The notification ID
     */
    @CacheEvict(cacheNames = RedisConfig.CACHE_NOTIFICATION_UNREAD_COUNT, key = "#userId")
    public void markAsRead(String userId, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException("NOTIFICATION_NOT_FOUND", "Notification not found", 404));

        if (!notification.getUserId().equals(userId)) {
            throw new ApiException("FORBIDDEN", "Notification does not belong to you", 403);
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
        log.debug("Marked notification {} as read for user {}", notificationId, userId);
    }

    /**
     * Mark all notifications as read for a user.
     *
     * @param userId The user ID
     */
    @CacheEvict(cacheNames = RedisConfig.CACHE_NOTIFICATION_UNREAD_COUNT, key = "#userId")
    public void markAllAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
        log.debug("Marked all notifications as read for user {}", userId);
    }

    /**
     * Create a notification for a single user.
     *
     * @param userId The user ID
     * @param type   The notification type
     * @param title  The notification title
     * @param body   The notification body
     * @param link   The link to the relevant resource
     */
    @CacheEvict(cacheNames = RedisConfig.CACHE_NOTIFICATION_UNREAD_COUNT, key = "#userId")
    public void createNotification(String userId, Notification.NotificationType type, String title, String body,
            String link, String courseId) {
        Notification notification = Notification.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .type(type)
                .title(title)
                .body(body)
                .link(link)
                .courseId(courseId)
                .isRead(false)
                .createdAt(java.time.Instant.now())
                .build();

        notificationRepository.save(notification);
        log.debug("Created notification for user {}: {}", userId, title);

        // Push real-time notification
        if (userId != null) {
            realtimeService.sendNotification(userId, mapToResponse(notification));
        }
    }

    /**
     * Create notifications for all students in a course (excluding the creator).
     * 
     * @param courseId      The course ID
     * @param excludeUserId User ID to exclude (e.g., the creator)
     * @param type          The notification type
     * @param title         The notification title
     * @param body          The notification body
     * @param link          The link to the relevant resource
     */
    public void notifyCourseStudents(String courseId, String excludeUserId, Notification.NotificationType type,
            String title, String body, String link) {
        List<String> studentIds = enrollmentRepository.findByCourseId(courseId).stream()
                .filter(enrollment -> enrollment
                        .getStatus() == com.courseflow.enrollments.model.Enrollment.EnrollmentStatus.ACTIVE)
                .filter(enrollment -> !enrollment.getUserId().equals(excludeUserId))
                .map(com.courseflow.enrollments.model.Enrollment::getUserId)
                .collect(Collectors.toList());

        for (String studentId : studentIds) {
            createNotification(studentId, type, title, body, link, courseId);
        }

        log.info("Created {} notifications for course {} (type: {})", studentIds.size(), courseId, type);
    }

    /**
     * Create a notification for a specific user (e.g., grade posted, discussion
     * reply).
     * 
     * @param userId The user ID
     * @param type   The notification type
     * @param title  The notification title
     * @param body   The notification body
     * @param link   The link to the relevant resource
     */
    public void notifyUser(String userId, Notification.NotificationType type, String title, String body, String link,
            String courseId) {
        createNotification(userId, type, title, body, link, courseId);
    }

    /**
     * Map Notification entity to NotificationResponse DTO.
     */
    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType() != null ? notification.getType().name() : "SYSTEM")
                .title(notification.getTitle() != null ? notification.getTitle() : "Notification")
                .body(notification.getBody() != null ? notification.getBody() : "")
                .link(notification.getLink())
                .courseId(notification.getCourseId())
                .isRead(notification.getIsRead() != null ? notification.getIsRead() : false)
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
