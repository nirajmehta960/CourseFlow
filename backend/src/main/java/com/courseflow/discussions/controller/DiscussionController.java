package com.courseflow.discussions.controller;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.security.RequireInstructor;
import com.courseflow.discussions.dto.DiscussionRequest;
import com.courseflow.discussions.dto.DiscussionResponse;
import com.courseflow.discussions.dto.PostRequest;
import com.courseflow.discussions.dto.PostResponse;
import com.courseflow.discussions.service.DiscussionService;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.users.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for discussion endpoints.
 */
@RestController
@RequestMapping("/courses/{courseId}/discussions")
@RequiredArgsConstructor
@Tag(name = "Discussions", description = "Discussion management endpoints")
public class DiscussionController {

    private final DiscussionService discussionService;
    private final AuthService authService;
    private final EnrollmentService enrollmentService;

    @GetMapping
    @Operation(summary = "Get all discussions", description = "Get all discussions for a course. Students see only published discussions.")
    public ResponseEntity<ApiResponse<List<DiscussionResponse>>> getDiscussions(
            @PathVariable String courseId,
            @RequestParam(required = false, defaultValue = "false") boolean includeUnpublished) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Only instructors can request unpublished discussions
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        boolean canSeeUnpublished = (isInstructor || isAdmin) && includeUnpublished;

        List<DiscussionResponse> discussions = discussionService.getDiscussions(courseId, canSeeUnpublished);
        return ResponseEntity.ok(ApiResponse.success(discussions));
    }

    @GetMapping("/{discussionId}")
    @Operation(summary = "Get discussion", description = "Get a discussion by ID with its posts.")
    public ResponseEntity<ApiResponse<DiscussionResponse>> getDiscussion(
            @PathVariable String courseId,
            @PathVariable String discussionId) {
        DiscussionResponse discussion = discussionService.getDiscussion(courseId, discussionId);
        return ResponseEntity.ok(ApiResponse.success(discussion));
    }

    @PostMapping
    @RequireInstructor
    @Operation(summary = "Create discussion", description = "Create a new discussion. Only instructors and TAs can create discussions.")
    public ResponseEntity<ApiResponse<DiscussionResponse>> createDiscussion(
            @PathVariable String courseId,
            @Valid @RequestBody DiscussionRequest request) {
        DiscussionResponse discussion = discussionService.createDiscussion(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(discussion, "Discussion created successfully"));
    }

    @PatchMapping("/{discussionId}")
    @RequireInstructor
    @Operation(summary = "Update discussion", description = "Update a discussion. Only instructors and TAs can update discussions.")
    public ResponseEntity<ApiResponse<DiscussionResponse>> updateDiscussion(
            @PathVariable String courseId,
            @PathVariable String discussionId,
            @Valid @RequestBody DiscussionRequest request) {
        DiscussionResponse discussion = discussionService.updateDiscussion(courseId, discussionId, request);
        return ResponseEntity.ok(ApiResponse.success(discussion, "Discussion updated successfully"));
    }

    @DeleteMapping("/{discussionId}")
    @RequireInstructor
    @Operation(summary = "Delete discussion", description = "Delete a discussion. Only instructors and TAs can delete discussions.")
    public ResponseEntity<ApiResponse<Void>> deleteDiscussion(
            @PathVariable String courseId,
            @PathVariable String discussionId) {
        discussionService.deleteDiscussion(courseId, discussionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Discussion deleted successfully"));
    }

    @PostMapping("/{discussionId}/posts")
    @Operation(summary = "Create post", description = "Create a post/reply in a discussion. All enrolled users can post.")
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @PathVariable String courseId,
            @PathVariable String discussionId,
            @Valid @RequestBody PostRequest request) {
        PostResponse post = discussionService.createPost(courseId, discussionId, request);
        return ResponseEntity.ok(ApiResponse.success(post, "Post created successfully"));
    }

    @PatchMapping("/posts/{postId}")
    @Operation(summary = "Update post", description = "Update a post. Only the author or instructors can update posts.")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @PathVariable String courseId,
            @PathVariable String postId,
            @Valid @RequestBody PostRequest request) {
        PostResponse post = discussionService.updatePost(courseId, postId, request);
        return ResponseEntity.ok(ApiResponse.success(post, "Post updated successfully"));
    }

    @DeleteMapping("/posts/{postId}")
    @Operation(summary = "Delete post", description = "Delete a post (soft delete). Only the author or instructors can delete posts.")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable String courseId,
            @PathVariable String postId) {
        discussionService.deletePost(courseId, postId);
        return ResponseEntity.ok(ApiResponse.success(null, "Post deleted successfully"));
    }
}
