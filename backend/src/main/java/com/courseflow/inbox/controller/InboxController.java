package com.courseflow.inbox.controller;

import com.courseflow.common.dto.ApiResponse;
import com.courseflow.inbox.dto.MessageRequest;
import com.courseflow.inbox.dto.MessageResponse;
import com.courseflow.inbox.dto.ThreadRequest;
import com.courseflow.inbox.dto.ThreadResponse;
import com.courseflow.inbox.service.InboxService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for inbox endpoints.
 */
@RestController
@RequestMapping("/inbox")
@RequiredArgsConstructor
@Tag(name = "Inbox", description = "Inbox and messaging endpoints")
public class InboxController {
    
    private final InboxService inboxService;
    
    @GetMapping("/threads")
    @Operation(summary = "Get threads", description = "Get all threads for the current user with optional filters (all/unread/starred) and search.")
    public ResponseEntity<ApiResponse<List<ThreadResponse>>> getThreads(
            @RequestParam(required = false, defaultValue = "all") String filter,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String courseId) {
        List<ThreadResponse> threads = inboxService.getThreads(filter, search, courseId);
        return ResponseEntity.ok(ApiResponse.success(threads));
    }
    
    @PostMapping("/threads")
    @Operation(summary = "Create thread", description = "Create a new thread (course discussion or direct message).")
    public ResponseEntity<ApiResponse<ThreadResponse>> createThread(
            @Valid @RequestBody ThreadRequest request) {
        ThreadResponse thread = inboxService.createThread(request);
        return ResponseEntity.ok(ApiResponse.success(thread, "Thread created successfully"));
    }
    
    @GetMapping("/threads/{threadId}/messages")
    @Operation(summary = "Get messages", description = "Get all messages for a thread. User must be a participant.")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(
            @PathVariable String threadId) {
        List<MessageResponse> messages = inboxService.getMessages(threadId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }
    
    @PostMapping("/threads/{threadId}/messages")
    @Operation(summary = "Send message", description = "Send a message in a thread. User must be a participant.")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable String threadId,
            @Valid @RequestBody MessageRequest request) {
        MessageResponse message = inboxService.sendMessage(threadId, request);
        return ResponseEntity.ok(ApiResponse.success(message, "Message sent successfully"));
    }
    
    @PostMapping("/messages/{messageId}/toggle-star")
    @Operation(summary = "Toggle star", description = "Star or unstar a message.")
    public ResponseEntity<ApiResponse<MessageResponse>> toggleStar(
            @PathVariable String messageId) {
        MessageResponse message = inboxService.toggleStar(messageId);
        return ResponseEntity.ok(ApiResponse.success(message, "Star status updated"));
    }
    
    @PostMapping("/threads/{threadId}/mark-read")
    @Operation(summary = "Mark thread as read", description = "Mark all messages in a thread as read for the current user.")
    public ResponseEntity<ApiResponse<Void>> markThreadRead(
            @PathVariable String threadId) {
        inboxService.markThreadRead(threadId);
        return ResponseEntity.ok(ApiResponse.success(null, "Thread marked as read"));
    }
}
