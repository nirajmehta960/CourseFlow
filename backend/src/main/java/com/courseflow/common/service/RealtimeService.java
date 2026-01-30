package com.courseflow.common.service;

import com.courseflow.inbox.dto.MessageResponse;
import com.courseflow.notifications.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RealtimeService {

    private final SimpMessagingTemplate messagingTemplate;
    private final com.courseflow.users.repository.UserRepository userRepository;

    /**
     * Send a notification to a specific user via WebSockets.
     */
    public void sendNotification(@NonNull String userId, NotificationResponse notification) {
        userRepository.findById(userId).ifPresent(user -> {
            log.debug("Pushing notification to user {} ({}): {}", userId, user.getEmail(), notification.getTitle());
            // Use email as it is the Principal name in SecurityUserDetails
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", notification);
        });
    }

    /**
     * Send an inbox message to a specific user via WebSockets.
     */
    public void sendMessage(@NonNull String userId, MessageResponse message) {
        userRepository.findById(userId).ifPresent(user -> {
            log.debug("Pushing message to user {} ({}): thread {}", userId, user.getEmail(), message.getThreadId());
            // Use email as it is the Principal name in SecurityUserDetails
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/messages", message);
        });
    }
}
