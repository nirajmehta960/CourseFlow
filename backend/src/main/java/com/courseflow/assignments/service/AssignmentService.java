package com.courseflow.assignments.service;

import com.courseflow.assignments.dto.AssignmentRequest;
import com.courseflow.assignments.dto.AssignmentResponse;
import com.courseflow.assignments.dto.GradeSubmissionRequest;
import com.courseflow.assignments.dto.SubmissionRequest;
import com.courseflow.assignments.dto.SubmissionResponse;
import com.courseflow.assignments.model.Assignment;
import com.courseflow.assignments.model.Submission;
import com.courseflow.assignments.repository.AssignmentRepository;
import com.courseflow.assignments.repository.SubmissionRepository;
import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.courses.repository.CourseRepository;
import com.courseflow.calendar.service.CalendarService;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.grades.service.GradebookService;
import com.courseflow.notifications.model.Notification;
import com.courseflow.notifications.service.NotificationService;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for handling assignment operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;
    private final AuthService authService;
    private final GradebookService gradebookService;
    private final CalendarService calendarService;
    private final NotificationService notificationService;

    /**
     * Get all assignments for a course.
     * 
     * @param courseId Course ID
     * @return List of assignment responses
     */
    public List<AssignmentResponse> getAssignments(String courseId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Get assignments for the course
        List<Assignment> assignments = assignmentRepository.findByCourseIdOrderByDueAtAsc(courseId);

        return assignments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create an assignment. Only instructors/admins can create assignments.
     * 
     * @param courseId Course ID
     * @param request  Assignment creation request
     * @return Created assignment response
     */
    public AssignmentResponse createAssignment(String courseId, AssignmentRequest request) {
        User currentUser = authService.getCurrentUser();

        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can create assignments", 403);
        }

        // Create assignment
        Assignment assignment = Assignment.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .description(request.getDescription())
                .points(request.getPoints())
                .dueAt(request.getDueAt())
                .availableFrom(request.getAvailableFrom())
                .availableUntil(request.getAvailableUntil())
                .published(request.getPublished() != null ? request.getPublished() : false)
                .maxAttempts(request.getMaxAttempts() != null ? request.getMaxAttempts() : 3)
                .createdBy(currentUser.getId())
                .build();

        assignment = assignmentRepository.save(assignment);
        log.info("Assignment created: {} by user {} in course {}",
                assignment.getId(), currentUser.getId(), courseId);

        // Sync calendar event
        calendarService.syncAssignmentEvent(assignment);

        return mapToResponse(assignment);
    }

    /**
     * Get assignment by ID. Verifies user is enrolled in the course.
     * 
     * @param courseId     Course ID
     * @param assignmentId Assignment ID
     * @return Assignment response
     */
    public AssignmentResponse getAssignment(String courseId, String assignmentId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Verify assignment exists and belongs to course
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));

        if (!assignment.getCourseId().equals(courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found in this course", 404);
        }

        return mapToResponse(assignment);
    }

    /**
     * Get assignment by ID (without courseId in path). Verifies user is enrolled in
     * the course.
     * 
     * @param assignmentId Assignment ID
     * @return Assignment response
     */
    public AssignmentResponse getAssignmentById(String assignmentId) {
        User currentUser = authService.getCurrentUser();

        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));

        // Verify enrollment
        enrollmentService.verifyEnrollment(assignment.getCourseId(), currentUser.getId());

        return mapToResponse(assignment);
    }

    /**
     * Update an assignment. Only instructors/admins can update assignments.
     * 
     * @param courseId     Course ID
     * @param assignmentId Assignment ID
     * @param request      Assignment update request
     * @return Updated assignment response
     */
    public AssignmentResponse updateAssignment(String courseId, String assignmentId, AssignmentRequest request) {
        User currentUser = authService.getCurrentUser();

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can update assignments", 403);
        }

        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));

        // Verify assignment belongs to course
        if (!assignment.getCourseId().equals(courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found in this course", 404);
        }

        // Update assignment fields
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setPoints(request.getPoints());
        assignment.setDueAt(request.getDueAt());
        assignment.setAvailableFrom(request.getAvailableFrom());
        assignment.setAvailableUntil(request.getAvailableUntil());
        if (request.getPublished() != null) {
            assignment.setPublished(request.getPublished());
        }
        if (request.getMaxAttempts() != null) {
            assignment.setMaxAttempts(request.getMaxAttempts());
        }

        assignment = assignmentRepository.save(assignment);
        log.info("Assignment updated: {} by user {} in course {}",
                assignmentId, currentUser.getId(), courseId);

        // Sync calendar event
        calendarService.syncAssignmentEvent(assignment);

        // Notify students if assignment is published (and wasn't before)
        if (assignment.getPublished()) {
            Assignment oldAssignment = assignmentRepository.findById(assignmentId).orElse(null);
            if (oldAssignment == null || !oldAssignment.getPublished()) {
                // Newly published assignment - notify students
                notificationService.notifyCourseStudents(
                        courseId,
                        currentUser.getId(),
                        Notification.NotificationType.NEW_ASSIGNMENT,
                        "New Assignment: " + assignment.getTitle(),
                        "A new assignment has been posted in your course.",
                        "/courses/" + courseId + "/assignments/" + assignment.getId());
            }
        }

        return mapToResponse(assignment);
    }

    /**
     * Update an assignment by ID (without courseId in path). Only
     * instructors/admins can update assignments.
     * 
     * @param assignmentId Assignment ID
     * @param request      Assignment update request
     * @return Updated assignment response
     */
    public AssignmentResponse updateAssignmentById(String assignmentId, AssignmentRequest request) {
        User currentUser = authService.getCurrentUser();

        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(assignment.getCourseId(), currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can update assignments", 403);
        }

        // Update assignment fields
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setPoints(request.getPoints());
        assignment.setDueAt(request.getDueAt());
        assignment.setAvailableFrom(request.getAvailableFrom());
        assignment.setAvailableUntil(request.getAvailableUntil());
        if (request.getPublished() != null) {
            assignment.setPublished(request.getPublished());
        }

        assignment = assignmentRepository.save(assignment);
        log.info("Assignment updated: {} by user {} in course {}",
                assignmentId, currentUser.getId(), assignment.getCourseId());

        return mapToResponse(assignment);
    }

    /**
     * Delete an assignment. Only instructors/admins can delete assignments.
     * 
     * @param courseId     Course ID
     * @param assignmentId Assignment ID
     */
    public void deleteAssignment(String courseId, String assignmentId) {
        User currentUser = authService.getCurrentUser();

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can delete assignments", 403);
        }

        // Verify assignment exists and belongs to course
        if (!assignmentRepository.existsByIdAndCourseId(assignmentId, courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404);
        }

        // Delete calendar event
        calendarService.deleteAssignmentEvent(assignmentId);

        // Delete assignment (this will cascade delete submissions if configured)
        assignmentRepository.deleteById(assignmentId);
        log.info("Assignment deleted: {} by user {} in course {}",
                assignmentId, currentUser.getId(), courseId);
    }

    /**
     * Submit an assignment by ID (without courseId in path). Students can submit
     * their work.
     * 
     * @param assignmentId Assignment ID
     * @param request      Submission request
     * @return Submission response
     */
    public SubmissionResponse submitAssignmentById(String assignmentId, SubmissionRequest request) {
        User currentUser = authService.getCurrentUser();

        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));

        // Verify enrollment
        enrollmentService.verifyEnrollment(assignment.getCourseId(), currentUser.getId());

        return submitAssignment(assignment.getCourseId(), assignmentId, request);
    }

    /**
     * Submit an assignment. Students can submit their work.
     * 
     * @param courseId     Course ID
     * @param assignmentId Assignment ID
     * @param request      Submission request
     * @return Submission response
     */
    public SubmissionResponse submitAssignment(String courseId, String assignmentId, SubmissionRequest request) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment (student must be enrolled)
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Verify assignment exists and belongs to course
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));

        if (!assignment.getCourseId().equals(courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found in this course", 404);
        }

        // Check if submission already exists (for attempts check)
        Submission submission;
        Optional<Submission> existingSubmissionOpt = submissionRepository.findByAssignmentIdAndStudentId(assignmentId,
                currentUser.getId());

        if (existingSubmissionOpt.isPresent()) {
            submission = existingSubmissionOpt.get();
            // Checking max attempts only if we are about to submit (not save draft)
            if (request.getStatus() == Submission.SubmissionStatus.SUBMITTED) {
                int maxAttempts = assignment.getMaxAttempts() != null ? assignment.getMaxAttempts() : 3;
                // If it's already submitted and we are submitting again, check if we reached
                // limit
                // Note: current attemptNumber is the number of attempts ALREADY made.
                if (submission.getStatus() == Submission.SubmissionStatus.SUBMITTED &&
                        submission.getAttemptNumber() >= maxAttempts) {
                    throw new ApiException("MAX_ATTEMPTS_REACHED",
                            "You have reached the maximum number of attempts (" + maxAttempts + ")", 409);
                }
            }
        } else {
            submission = Submission.builder()
                    .id(UUID.randomUUID().toString())
                    .courseId(courseId)
                    .assignmentId(assignmentId)
                    .studentId(currentUser.getId())
                    .status(Submission.SubmissionStatus.DRAFT)
                    .attemptNumber(0)
                    .build();
        }

        try {
            boolean isNewSubmissionAction = false;

            // detecting transition to SUBMITTED
            if (request.getStatus() == Submission.SubmissionStatus.SUBMITTED) {
                if (submission.getStatus() != Submission.SubmissionStatus.SUBMITTED) {
                    // Transition from DRAFT/None -> SUBMITTED
                    isNewSubmissionAction = true;
                } else {
                    // Already SUBMITTED -> Re-submission (Another try)
                    isNewSubmissionAction = true;
                }
            }

            // Update fields
            submission.setStatus(request.getStatus() != null ? request.getStatus() : Submission.SubmissionStatus.DRAFT);
            submission.setBodyText(request.getBodyText());
            submission.setFileUrls(request.getFileUrls() != null ? new java.util.ArrayList<>(request.getFileUrls())
                    : new java.util.ArrayList<>());

            if (isNewSubmissionAction) {
                submission.setAttemptNumber(submission.getAttemptNumber() + 1);
                submission.setSubmittedAt(Instant.now());
                // Clear any previous grade when a new attempt is made
                submission.setGrade(null);
            }

            submission = submissionRepository.save(submission);
            log.info("Assignment submission {}: assignment {} by student {} attempt {}",
                    submission.getStatus(), assignmentId, currentUser.getId(), submission.getAttemptNumber());

            // Update gradebook on submission
            if (submission.getStatus() == Submission.SubmissionStatus.SUBMITTED) {
                gradebookService.updateGradebookOnSubmission(courseId, currentUser.getId(), assignmentId, "SUBMITTED");
            }

            return mapToSubmissionResponse(submission);
        } catch (DuplicateKeyException e) {
            throw new ApiException("SUBMISSION_ALREADY_EXISTS",
                    "You have already submitted this assignment", 409);
        }
    }

    /**
     * Get all submissions for an assignment by ID (without courseId in path). Only
     * instructors can view all submissions.
     * 
     * @param assignmentId Assignment ID
     * @return List of submission responses
     */
    public List<SubmissionResponse> getSubmissionsById(String assignmentId) {
        User currentUser = authService.getCurrentUser();

        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));

        return getSubmissions(assignment.getCourseId(), assignmentId);
    }

    /**
     * Get all submissions for an assignment. Only instructors can view all
     * submissions.
     * 
     * @param courseId     Course ID
     * @param assignmentId Assignment ID
     * @return List of submission responses
     */
    public List<SubmissionResponse> getSubmissions(String courseId, String assignmentId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can view all submissions", 403);
        }

        // Verify assignment exists and belongs to course
        if (!assignmentRepository.existsByIdAndCourseId(assignmentId, courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404);
        }

        // Get all submissions for the assignment
        List<Submission> submissions = submissionRepository.findByAssignmentId(assignmentId);

        return submissions.stream()
                .sorted((s1, s2) -> {
                    if (s1.getSubmittedAt() == null)
                        return 1;
                    if (s2.getSubmittedAt() == null)
                        return -1;
                    return s2.getSubmittedAt().compareTo(s1.getSubmittedAt());
                })
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
    }

    /**
     * Grade a submission by ID (without courseId/assignmentId in path). Only
     * instructors/admins can grade submissions.
     * 
     * @param submissionId Submission ID
     * @param request      Grade request
     * @return Graded submission response
     */
    public SubmissionResponse gradeSubmissionById(String submissionId, GradeSubmissionRequest request) {
        User currentUser = authService.getCurrentUser();

        // Get submission
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ApiException("SUBMISSION_NOT_FOUND", "Submission not found", 404));

        return gradeSubmission(submission.getCourseId(), submission.getAssignmentId(), submissionId, request);
    }

    /**
     * Grade a submission. Only instructors/admins can grade submissions.
     * 
     * @param courseId     Course ID
     * @param assignmentId Assignment ID
     * @param submissionId Submission ID
     * @param request      Grade request
     * @return Graded submission response
     */
    public SubmissionResponse gradeSubmission(String courseId, String assignmentId, String submissionId,
            GradeSubmissionRequest request) {
        User currentUser = authService.getCurrentUser();

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can grade submissions", 403);
        }

        // Verify assignment exists and belongs to course
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));

        if (!assignment.getCourseId().equals(courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found in this course", 404);
        }

        // Verify submission exists and belongs to assignment
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ApiException("SUBMISSION_NOT_FOUND", "Submission not found", 404));

        if (!submission.getAssignmentId().equals(assignmentId)) {
            throw new ApiException("SUBMISSION_NOT_FOUND", "Submission not found for this assignment", 404);
        }

        // Validate points awarded doesn't exceed assignment points
        if (request.getPointsAwarded() != null && request.getPointsAwarded() > assignment.getPoints()) {
            throw new ApiException("INVALID_POINTS",
                    "Points awarded cannot exceed assignment points (" + assignment.getPoints() + ")", 400);
        }

        // Grade the submission
        Submission.Grade grade = Submission.Grade.builder()
                .pointsAwarded(request.getPointsAwarded())
                .feedback(request.getFeedback())
                .gradedBy(currentUser.getId())
                .gradedAt(Instant.now())
                .build();

        submission.setGrade(grade);
        submission = submissionRepository.save(submission);

        log.info("Submission graded: submission {} for assignment {} by user {} in course {}",
                submissionId, assignmentId, currentUser.getId(), courseId);

        // Update gradebook on grade
        if (request.getPointsAwarded() != null) {
            gradebookService.updateGradebookOnGrade(courseId, submission.getStudentId(), assignmentId,
                    request.getPointsAwarded(), assignment.getPoints());

            // Notify student about grade
            notificationService.notifyUser(
                    submission.getStudentId(),
                    Notification.NotificationType.GRADE_POSTED,
                    "Grade Posted: " + assignment.getTitle(),
                    "Your submission has been graded. Score: " + request.getPointsAwarded() + " / "
                            + assignment.getPoints(),
                    "/courses/" + courseId + "/assignments/" + assignmentId);
        }

        return mapToSubmissionResponse(submission);
    }

    /**
     * Get student's own submission for an assignment by ID (without courseId in
     * path).
     * 
     * @param assignmentId Assignment ID
     * @return Submission response or null if not found
     */
    public SubmissionResponse getMySubmissionById(String assignmentId) {
        User currentUser = authService.getCurrentUser();

        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404));

        // Verify enrollment
        enrollmentService.verifyEnrollment(assignment.getCourseId(), currentUser.getId());

        // Get student's submission
        Optional<Submission> submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId,
                currentUser.getId());

        if (submission.isEmpty()) {
            return null;
        }

        return mapToSubmissionResponse(submission.get());
    }

    /**
     * Get student's own submission for an assignment.
     * 
     * @param courseId     Course ID
     * @param assignmentId Assignment ID
     * @return Submission response or null if not found
     */
    public SubmissionResponse getMySubmission(String courseId, String assignmentId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Verify assignment exists and belongs to course
        if (!assignmentRepository.existsByIdAndCourseId(assignmentId, courseId)) {
            throw new ApiException("ASSIGNMENT_NOT_FOUND", "Assignment not found", 404);
        }

        // Get student's submission
        Optional<Submission> submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId,
                currentUser.getId());

        if (submission.isEmpty()) {
            return null;
        }

        return mapToSubmissionResponse(submission.get());
    }

    /**
     * Map Assignment entity to AssignmentResponse DTO.
     */
    private AssignmentResponse mapToResponse(Assignment assignment) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .courseId(assignment.getCourseId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .points(assignment.getPoints())
                .dueAt(assignment.getDueAt())
                .availableFrom(assignment.getAvailableFrom())
                .availableUntil(assignment.getAvailableUntil())
                .published(assignment.getPublished())
                .createdBy(assignment.getCreatedBy())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .maxAttempts(assignment.getMaxAttempts())
                .build();
    }

    /**
     * Map Submission entity to SubmissionResponse DTO.
     */
    private SubmissionResponse mapToSubmissionResponse(Submission submission) {
        SubmissionResponse.GradeInfo gradeInfo = null;
        if (submission.getGrade() != null) {
            gradeInfo = SubmissionResponse.GradeInfo.builder()
                    .pointsAwarded(submission.getGrade().getPointsAwarded())
                    .feedback(submission.getGrade().getFeedback())
                    .gradedBy(submission.getGrade().getGradedBy())
                    .gradedAt(submission.getGrade().getGradedAt())
                    .build();
        }

        return SubmissionResponse.builder()
                .id(submission.getId())
                .courseId(submission.getCourseId())
                .assignmentId(submission.getAssignmentId())
                .studentId(submission.getStudentId())
                .status(submission.getStatus())
                .bodyText(submission.getBodyText())
                .fileUrls(submission.getFileUrls() != null ? new java.util.ArrayList<>(submission.getFileUrls())
                        : new java.util.ArrayList<>())
                .submittedAt(submission.getSubmittedAt())
                .attemptNumber(submission.getAttemptNumber())
                .grade(gradeInfo)
                .build();
    }
}
