package com.courseflow.notifications.controller;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.error.ApiException;
import com.courseflow.notifications.dto.NotificationResponse;
import com.courseflow.notifications.service.NotificationService;
import com.courseflow.users.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for notification endpoints.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification management endpoints")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Get notifications", description = "Get all notifications for the logged-in user.")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications() {
        try {
            User currentUser = authService.getCurrentUser();
            List<NotificationResponse> notifications = notificationService.getNotifications(currentUser.getId());
            return ResponseEntity.ok(ApiResponse.success(notifications));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new ApiException("NOTIFICATION_ERROR", "Error fetching notifications: " + e.getMessage(), 500);
        }
    }

    @GetMapping("/unread")
    @Operation(summary = "Get unread notifications", description = "Get unread notifications for the logged-in user.")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUnreadNotifications() {
        User currentUser = authService.getCurrentUser();
        List<NotificationResponse> notifications = notificationService.getUnreadNotifications(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Get unread count", description = "Get the count of unread notifications for the logged-in user.")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        try {
            User currentUser = authService.getCurrentUser();
            long count = notificationService.getUnreadCount(currentUser.getId());
            return ResponseEntity.ok(ApiResponse.success(count));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new ApiException("UNREAD_COUNT_ERROR", "Error fetching unread count: " + e.getMessage(), 500);
        }
    }

    @PostMapping("/{notificationId}/read")
    @Operation(summary = "Mark notification as read", description = "Mark a specific notification as read.")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable String notificationId) {
        User currentUser = authService.getCurrentUser();
        notificationService.markAsRead(currentUser.getId(), notificationId);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Mark all notifications as read for the logged-in user.")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        User currentUser = authService.getCurrentUser();
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }
}
