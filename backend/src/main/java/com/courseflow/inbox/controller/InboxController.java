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
@RequestMapping("/api/inbox")
@RequiredArgsConstructor
@Tag(name = "Inbox", description = "Inbox and messaging endpoints")
public class InboxController {
    
    private final InboxService inboxService;
    
    @GetMapping
    @Operation(summary = "List conversations", description = "Get all conversations for the current user with optional filters (all/unread/starred) and search.")
    public ResponseEntity<ApiResponse<List<ThreadResponse>>> getConversations(
            @RequestParam(required = false, defaultValue = "all") String filter,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String courseId) {
        List<ThreadResponse> threads = inboxService.getThreads(filter, search, courseId);
        return ResponseEntity.ok(ApiResponse.success(threads));
    }
    
    @GetMapping("/{conversationId}")
    @Operation(summary = "Get conversation", description = "Get a conversation by ID with its messages. User must be a participant.")
    public ResponseEntity<ApiResponse<ThreadResponse>> getConversation(
            @PathVariable String conversationId) {
        ThreadResponse thread = inboxService.getThread(conversationId);
        return ResponseEntity.ok(ApiResponse.success(thread));
    }
    
    @PostMapping
    @Operation(summary = "Start conversation", description = "Create a new conversation (course discussion or direct message).")
    public ResponseEntity<ApiResponse<ThreadResponse>> createConversation(
            @Valid @RequestBody ThreadRequest request) {
        ThreadResponse thread = inboxService.createThread(request);
        return ResponseEntity.ok(ApiResponse.success(thread, "Conversation created successfully"));
    }
    
    @GetMapping("/{conversationId}/messages")
    @Operation(summary = "Get messages", description = "Get all messages for a conversation. User must be a participant.")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(
            @PathVariable String conversationId) {
        List<MessageResponse> messages = inboxService.getMessages(conversationId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }
    
    @PostMapping("/{conversationId}/messages")
    @Operation(summary = "Send message", description = "Send a message in a conversation. User must be a participant.")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody MessageRequest request) {
        MessageResponse message = inboxService.sendMessage(conversationId, request);
        return ResponseEntity.ok(ApiResponse.success(message, "Message sent successfully"));
    }
    
    @PostMapping("/{conversationId}/read")
    @Operation(summary = "Mark conversation as read", description = "Mark all messages in a conversation as read for the current user.")
    public ResponseEntity<ApiResponse<Void>> markConversationRead(
            @PathVariable String conversationId) {
        inboxService.markThreadRead(conversationId);
        return ResponseEntity.ok(ApiResponse.success(null, "Conversation marked as read"));
    }
    
    @PostMapping("/messages/{messageId}/toggle-star")
    @Operation(summary = "Toggle star", description = "Star or unstar a message.")
    public ResponseEntity<ApiResponse<MessageResponse>> toggleStar(
            @PathVariable String messageId) {
        MessageResponse message = inboxService.toggleStar(messageId);
        return ResponseEntity.ok(ApiResponse.success(message, "Star status updated"));
    }
}
