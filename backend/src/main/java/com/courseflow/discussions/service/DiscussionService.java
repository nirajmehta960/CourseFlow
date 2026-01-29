package com.courseflow.discussions.service;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.discussions.dto.DiscussionRequest;
import com.courseflow.notifications.model.Notification;
import com.courseflow.notifications.service.NotificationService;
import com.courseflow.discussions.dto.DiscussionResponse;
import com.courseflow.discussions.dto.PostRequest;
import com.courseflow.discussions.dto.PostResponse;
import com.courseflow.discussions.model.Discussion;
import com.courseflow.discussions.model.Post;
import com.courseflow.discussions.repository.DiscussionRepository;
import com.courseflow.discussions.repository.PostRepository;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for handling discussion operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final PostRepository postRepository;
    private final AuthService authService;
    private final EnrollmentService enrollmentService;
    private final NotificationService notificationService;
    private final com.courseflow.users.repository.UserRepository userRepository;

    /**
     * Get all discussions for a course.
     * 
     * @param courseId           The course ID
     * @param includeUnpublished Whether to include unpublished discussions
     *                           (instructors only)
     * @return List of discussion responses
     */
    public List<DiscussionResponse> getDiscussions(String courseId, boolean includeUnpublished) {
        // Verify enrollment
        User currentUser = authService.getCurrentUser();
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        List<Discussion> discussions;
        if (includeUnpublished) {
            // Check if user is instructor/TA
            boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
            boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

            if (isInstructor || isAdmin) {
                discussions = discussionRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
            } else {
                discussions = discussionRepository.findByCourseIdAndPublishedOrderByCreatedAtDesc(courseId, true);
            }
        } else {
            discussions = discussionRepository.findByCourseIdAndPublishedOrderByCreatedAtDesc(courseId, true);
        }

        return discussions.stream()
                .map(discussion -> {
                    long postCount = postRepository.countByDiscussionIdAndDeletedFalse(discussion.getId());
                    return mapToResponse(discussion, postCount, null);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get a discussion by ID with its posts.
     * 
     * @param courseId     The course ID
     * @param discussionId The discussion ID
     * @return Discussion response with posts
     */
    public DiscussionResponse getDiscussion(String courseId, String discussionId) {
        // Verify enrollment
        User currentUser = authService.getCurrentUser();
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Check if discussion exists in course
        if (!discussionRepository.existsByIdAndCourseId(discussionId, courseId)) {
            throw new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404);
        }

        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404));

        // Check if user can view unpublished discussion
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!discussion.getPublished() && !isInstructor && !isAdmin) {
            throw new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404);
        }

        // Get all posts for this discussion
        List<Post> posts = postRepository.findByDiscussionIdAndDeletedFalseOrderByCreatedAtAsc(discussionId);

        // Build nested structure (1 level deep for MVP)
        List<PostResponse> postResponses = buildPostTree(posts);

        long postCount = posts.size();

        return mapToResponse(discussion, postCount, postResponses);
    }

    /**
     * Create a new discussion.
     * 
     * @param courseId The course ID
     * @param request  The discussion request
     * @return Created discussion response
     */
    public DiscussionResponse createDiscussion(String courseId, DiscussionRequest request) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Check permission: must be instructor/TA or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and TAs can create discussions", 403);
        }

        Discussion discussion = Discussion.builder()
                .id(UUID.randomUUID().toString())
                .courseId(courseId)
                .title(request.getTitle())
                .bodyHtml(request.getBodyHtml())
                .published(request.getPublished() != null ? request.getPublished() : false)
                .createdBy(currentUser.getId())
                .createdAt(java.time.Instant.now())
                .updatedAt(java.time.Instant.now())
                .build();

        discussion = discussionRepository.save(discussion);

        log.info("Created discussion: {} in course {} by user {}",
                discussion.getId(), courseId, currentUser.getId());

        return mapToResponse(discussion, 0L, null);
    }

    /**
     * Update a discussion.
     * 
     * @param courseId     The course ID
     * @param discussionId The discussion ID
     * @param request      The update request
     * @return Updated discussion response
     */
    public DiscussionResponse updateDiscussion(String courseId, String discussionId, DiscussionRequest request) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Check permission: must be instructor/TA or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and TAs can edit discussions", 403);
        }

        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404));

        // Verify discussion belongs to course
        if (!discussion.getCourseId().equals(courseId)) {
            throw new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404);
        }

        discussion.setTitle(request.getTitle());
        discussion.setBodyHtml(request.getBodyHtml());
        if (request.getPublished() != null) {
            discussion.setPublished(request.getPublished());
        }

        discussion = discussionRepository.save(discussion);

        log.info("Updated discussion: {} in course {} by user {}",
                discussionId, courseId, currentUser.getId());

        long postCount = postRepository.countByDiscussionIdAndDeletedFalse(discussionId);
        return mapToResponse(discussion, postCount, null);
    }

    /**
     * Delete a discussion.
     * 
     * @param courseId     The course ID
     * @param discussionId The discussion ID
     */
    public void deleteDiscussion(String courseId, String discussionId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Check permission: must be instructor/TA or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and TAs can delete discussions", 403);
        }

        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404));

        // Verify discussion belongs to course
        if (!discussion.getCourseId().equals(courseId)) {
            throw new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404);
        }

        // Delete all posts for this discussion
        List<Post> posts = postRepository.findByDiscussionIdOrderByCreatedAtAsc(discussionId);
        postRepository.deleteAll(posts);

        // Delete discussion
        discussionRepository.delete(discussion);

        log.info("Deleted discussion: {} in course {} by user {}",
                discussionId, courseId, currentUser.getId());
    }

    /**
     * Create a post/reply in a discussion.
     * 
     * @param courseId     The course ID
     * @param discussionId The discussion ID
     * @param request      The post request
     * @return Created post response
     */
    public PostResponse createPost(String courseId, String discussionId, PostRequest request) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Verify discussion exists and is accessible
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404));

        if (!discussion.getCourseId().equals(courseId)) {
            throw new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404);
        }

        // Check if discussion is published (or user is instructor)
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!discussion.getPublished() && !isInstructor && !isAdmin) {
            throw new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404);
        }

        // If parentPostId is provided, verify it exists and belongs to the discussion
        if (request.getParentPostId() != null && !request.getParentPostId().isBlank()) {
            Optional<Post> parentPost = postRepository.findById(request.getParentPostId());
            if (parentPost.isEmpty() || !parentPost.get().getDiscussionId().equals(discussionId)) {
                throw new ApiException("INVALID_PARENT_POST", "Parent post not found", 400);
            }
        }

        Post post = Post.builder()
                .id(UUID.randomUUID().toString())
                .discussionId(discussionId)
                .userId(currentUser.getId())
                .bodyHtml(request.getBodyHtml())
                .parentPostId(request.getParentPostId())
                .deleted(false)
                .createdAt(java.time.Instant.now())
                .updatedAt(java.time.Instant.now())
                .build();

        post = postRepository.save(post);

        log.info("Created post: {} in discussion {} by user {}",
                post.getId(), discussionId, currentUser.getId());

        // Notify discussion creator and parent post author if this is a reply
        if (request.getParentPostId() != null && !request.getParentPostId().isBlank()) {
            // Notify parent post author
            Optional<Post> parentPost = postRepository.findById(request.getParentPostId());
            if (parentPost.isPresent() && !parentPost.get().getUserId().equals(currentUser.getId())) {
                notificationService.notifyUser(
                        parentPost.get().getUserId(),
                        Notification.NotificationType.DISCUSSION_REPLY,
                        "New Reply: " + discussion.getTitle(),
                        currentUser.getId() + " replied to your post in " + discussion.getTitle(),
                        "/courses/" + courseId + "/discussions/" + discussionId,
                        courseId);
            }
        } else {
            // Notify discussion creator if this is a top-level post
            if (!discussion.getCreatedBy().equals(currentUser.getId())) {
                notificationService.notifyUser(
                        discussion.getCreatedBy(),
                        Notification.NotificationType.DISCUSSION_REPLY,
                        "New Reply: " + discussion.getTitle(),
                        currentUser.getId() + " posted in " + discussion.getTitle(),
                        "/courses/" + courseId + "/discussions/" + discussionId,
                        courseId);
            }
        }

        return mapToPostResponse(post, new ArrayList<>());
    }

    /**
     * Update a post.
     * 
     * @param courseId The course ID
     * @param postId   The post ID
     * @param request  The update request
     * @return Updated post response
     */
    public PostResponse updatePost(String courseId, String postId, PostRequest request) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException("POST_NOT_FOUND", "Post not found", 404));

        // Verify post belongs to discussion in course
        Discussion discussion = discussionRepository.findById(post.getDiscussionId())
                .orElseThrow(() -> new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404));

        if (!discussion.getCourseId().equals(courseId)) {
            throw new ApiException("POST_NOT_FOUND", "Post not found", 404);
        }

        // Check permission: author or instructor/TA
        boolean isAuthor = post.getUserId().equals(currentUser.getId());
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isAuthor && !isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only the author or instructors can edit posts", 403);
        }

        post.setBodyHtml(request.getBodyHtml());
        post = postRepository.save(post);

        log.info("Updated post: {} by user {}", postId, currentUser.getId());

        List<Post> replies = postRepository.findByParentPostIdAndDeletedFalseOrderByCreatedAtAsc(postId);
        List<PostResponse> replyResponses = replies.stream()
                .map(reply -> mapToPostResponse(reply, new ArrayList<>()))
                .collect(Collectors.toList());

        return mapToPostResponse(post, replyResponses);
    }

    /**
     * Delete a post (soft delete).
     * 
     * @param courseId The course ID
     * @param postId   The post ID
     */
    public void deletePost(String courseId, String postId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException("POST_NOT_FOUND", "Post not found", 404));

        // Verify post belongs to discussion in course
        Discussion discussion = discussionRepository.findById(post.getDiscussionId())
                .orElseThrow(() -> new ApiException("DISCUSSION_NOT_FOUND", "Discussion not found", 404));

        if (!discussion.getCourseId().equals(courseId)) {
            throw new ApiException("POST_NOT_FOUND", "Post not found", 404);
        }

        // Check permission: author or instructor/TA
        boolean isAuthor = post.getUserId().equals(currentUser.getId());
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isAuthor && !isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only the author or instructors can delete posts", 403);
        }

        // Soft delete
        post.setDeleted(true);
        postRepository.save(post);

        log.info("Deleted post: {} by user {}", postId, currentUser.getId());
    }

    /**
     * Build a tree structure of posts (1 level deep for MVP).
     */
    private List<PostResponse> buildPostTree(List<Post> posts) {
        // Separate top-level posts and replies
        Map<String, List<Post>> repliesMap = posts.stream()
                .filter(post -> post.getParentPostId() != null && !post.getParentPostId().isBlank())
                .collect(Collectors.groupingBy(Post::getParentPostId));

        // Build responses for top-level posts with their replies
        return posts.stream()
                .filter(post -> post.getParentPostId() == null || post.getParentPostId().isBlank())
                .map(post -> {
                    List<Post> replies = repliesMap.getOrDefault(post.getId(), new ArrayList<>());
                    List<PostResponse> replyResponses = replies.stream()
                            .map(reply -> mapToPostResponse(reply, new ArrayList<>()))
                            .collect(Collectors.toList());
                    return mapToPostResponse(post, replyResponses);
                })
                .collect(Collectors.toList());
    }

    /**
     * Map Discussion entity to DiscussionResponse DTO.
     */
    private DiscussionResponse mapToResponse(Discussion discussion, Long postCount, List<PostResponse> posts) {
        User author = userRepository.findById(discussion.getCreatedBy()).orElse(null);
        String authorName = author != null ? author.getName() : "Unknown User";

        return DiscussionResponse.builder()
                .id(discussion.getId())
                .courseId(discussion.getCourseId())
                .title(discussion.getTitle())
                .bodyHtml(discussion.getBodyHtml())
                .published(discussion.getPublished())
                .createdBy(discussion.getCreatedBy())
                .authorName(authorName)
                .createdAt(discussion.getCreatedAt())
                .updatedAt(discussion.getUpdatedAt())
                .postCount(postCount)
                .posts(posts)
                .build();
    }

    /**
     * Map Post entity to PostResponse DTO.
     */
    private PostResponse mapToPostResponse(Post post, List<PostResponse> replies) {
        User author = userRepository.findById(post.getUserId()).orElse(null);
        String authorName = author != null ? author.getName() : "Unknown User";

        return PostResponse.builder()
                .id(post.getId())
                .discussionId(post.getDiscussionId())
                .userId(post.getUserId())
                .authorName(authorName)
                .bodyHtml(post.getBodyHtml())
                .parentPostId(post.getParentPostId())
                .deleted(post.getDeleted())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .replies(replies)
                .build();
    }
}
