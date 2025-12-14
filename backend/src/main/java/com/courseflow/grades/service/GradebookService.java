package com.courseflow.grades.service;

import com.courseflow.assignments.model.Assignment;
import com.courseflow.assignments.model.Submission;
import com.courseflow.assignments.repository.AssignmentRepository;
import com.courseflow.assignments.repository.SubmissionRepository;
import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.enrollments.model.Enrollment;
import com.courseflow.enrollments.repository.EnrollmentRepository;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.grades.dto.GradebookResponse;
import com.courseflow.grades.dto.GradebookViewResponse;
import com.courseflow.grades.model.Gradebook;
import com.courseflow.grades.repository.GradebookRepository;
import com.courseflow.quizzes.model.Question;
import com.courseflow.quizzes.model.Quiz;
import com.courseflow.quizzes.model.QuizAttempt;
import com.courseflow.quizzes.repository.QuestionRepository;
import com.courseflow.quizzes.repository.QuizAttemptRepository;
import com.courseflow.quizzes.repository.QuizRepository;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for handling gradebook operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GradebookService {

    private final GradebookRepository gradebookRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final AuthService authService;
    private final com.courseflow.users.repository.UserRepository userRepository;

    /**
     * Get or create gradebook for a course and student.
     * 
     * @param courseId  The course ID
     * @param studentId The student ID
     * @return Gradebook entity
     */
    private Gradebook getOrCreateGradebook(String courseId, String studentId) {
        Optional<Gradebook> existing = gradebookRepository.findByCourseIdAndStudentId(courseId, studentId);

        if (existing.isPresent()) {
            return existing.get();
        }

        // Create new gradebook
        Gradebook gradebook = Gradebook.builder()
                .id(UUID.randomUUID().toString())
                .courseId(courseId)
                .studentId(studentId)
                .items(new ArrayList<>())
                .total(Gradebook.Total.builder()
                        .earned(0.0)
                        .possible(0.0)
                        .percent(0.0)
                        .build())
                .build();

        try {
            gradebook = gradebookRepository.save(gradebook);
            log.debug("Created new gradebook for student {} in course {}", studentId, courseId);
        } catch (DuplicateKeyException e) {
            // Race condition: another thread created it, fetch it
            gradebook = gradebookRepository.findByCourseIdAndStudentId(courseId, studentId)
                    .orElseThrow(() -> new ApiException("DATABASE_ERROR",
                            "Failed to create or fetch gradebook. Please try again.", 500));
        }

        return gradebook;
    }

    /**
     * Update gradebook when a student submits an assignment.
     * 
     * @param courseId     The course ID
     * @param studentId    The student ID
     * @param assignmentId The assignment ID
     * @param status       The status (typically "SUBMITTED")
     */
    public void updateGradebookOnSubmission(String courseId, String studentId, String assignmentId, String status) {
        // Get assignment to retrieve title and points
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElse(null);

        if (assignment == null) {
            log.warn("Assignment {} not found when updating gradebook", assignmentId);
            return;
        }

        Gradebook gradebook = getOrCreateGradebook(courseId, studentId);

        // Find existing item or create new one
        Optional<Gradebook.GradeItem> existingItemOpt = gradebook.getItems().stream()
                .filter(item -> item.getItemId().equals(assignmentId) &&
                        item.getType() == Gradebook.ItemType.ASSIGNMENT)
                .findFirst();

        if (existingItemOpt.isPresent()) {
            // Update existing item
            Gradebook.GradeItem item = existingItemOpt.get();
            item.setStatus(status);
            item.setPoints(assignment.getPoints());
            if (item.getTitle() == null || item.getTitle().isBlank()) {
                item.setTitle(assignment.getTitle());
            }
        } else {
            // Create new item
            Gradebook.GradeItem newItem = Gradebook.GradeItem.builder()
                    .type(Gradebook.ItemType.ASSIGNMENT)
                    .itemId(assignmentId)
                    .title(assignment.getTitle())
                    .score(null)
                    .points(assignment.getPoints())
                    .status(status)
                    .gradedAt(null)
                    .build();

            gradebook.getItems().add(newItem);
        }

        gradebookRepository.save(gradebook);
        log.debug("Updated gradebook for student {} in course {} on assignment submission",
                studentId, courseId);
    }

    /**
     * Update gradebook when an instructor grades a submission.
     * 
     * @param courseId     The course ID
     * @param studentId    The student ID
     * @param assignmentId The assignment ID
     * @param score        The score received
     * @param points       The maximum points possible
     */
    public void updateGradebookOnGrade(String courseId, String studentId, String assignmentId,
            Double score, Double points) {
        Gradebook gradebook = getOrCreateGradebook(courseId, studentId);

        // Get assignment for title
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElse(null);
        String title = assignment != null ? assignment.getTitle() : "Assignment";

        // Find existing item or create new one
        Optional<Gradebook.GradeItem> existingItemOpt = gradebook.getItems().stream()
                .filter(item -> item.getItemId().equals(assignmentId) &&
                        item.getType() == Gradebook.ItemType.ASSIGNMENT)
                .findFirst();

        Gradebook.GradeItem item;
        if (existingItemOpt.isPresent()) {
            item = existingItemOpt.get();
        } else {
            // Create new item if it doesn't exist
            item = Gradebook.GradeItem.builder()
                    .type(Gradebook.ItemType.ASSIGNMENT)
                    .itemId(assignmentId)
                    .title(title)
                    .build();
            gradebook.getItems().add(item);
        }

        // Update item with grade information
        item.setScore(score);
        item.setPoints(points);
        item.setStatus("GRADED");
        item.setGradedAt(Instant.now());
        if (item.getTitle() == null || item.getTitle().isBlank()) {
            item.setTitle(title);
        }

        // Get feedback from submission
        Optional<Submission> submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId);
        if (submission.isPresent() && submission.get().getGrade() != null) {
            item.setFeedback(submission.get().getGrade().getFeedback());
        }

        // Recalculate totals
        recalculateTotals(gradebook);

        gradebookRepository.save(gradebook);
        log.debug("Updated gradebook for student {} in course {} on assignment grade",
                studentId, courseId);
    }

    /**
     * Update gradebook when a student submits a quiz.
     * 
     * @param courseId    The course ID
     * @param studentId   The student ID
     * @param quizId      The quiz ID
     * @param score       The score received
     * @param totalPoints The maximum points possible
     * @param quizTitle   The quiz title
     */
    public void updateGradebookOnQuizSubmission(String courseId, String studentId, String quizId,
            Double score, Double totalPoints, String quizTitle) {
        Gradebook gradebook = getOrCreateGradebook(courseId, studentId);

        // Find existing item or create new one
        Optional<Gradebook.GradeItem> existingItemOpt = gradebook.getItems().stream()
                .filter(item -> item.getItemId().equals(quizId) &&
                        item.getType() == Gradebook.ItemType.QUIZ)
                .findFirst();

        Gradebook.GradeItem item;
        if (existingItemOpt.isPresent()) {
            item = existingItemOpt.get();
        } else {
            // Create new item if it doesn't exist
            item = Gradebook.GradeItem.builder()
                    .type(Gradebook.ItemType.QUIZ)
                    .itemId(quizId)
                    .title(quizTitle)
                    .build();
            gradebook.getItems().add(item);
        }

        // Update item with quiz score information
        item.setScore(score);
        item.setPoints(totalPoints);
        item.setStatus("GRADED");
        item.setGradedAt(Instant.now());
        if (item.getTitle() == null || item.getTitle().isBlank()) {
            item.setTitle(quizTitle);
        }

        // Recalculate totals
        recalculateTotals(gradebook);

        gradebookRepository.save(gradebook);
        log.debug("Updated gradebook for student {} in course {} on quiz submission",
                studentId, courseId);
    }

    /**
     * Recalculate totals for a gradebook based on all items.
     * 
     * @param gradebook The gradebook to recalculate
     */
    public void recalculateTotals(Gradebook gradebook) {
        double earned = 0.0;
        double possible = 0.0;

        for (Gradebook.GradeItem item : gradebook.getItems()) {
            if (item.getPoints() != null && item.getPoints() > 0) {
                // Use override score if present, otherwise use regular score
                Double finalScore = item.getOverrideScore() != null ? item.getOverrideScore() : item.getScore();

                // Only count score if it's been graded
                if (finalScore != null && item.getStatus() != null &&
                        item.getStatus().equals("GRADED")) {
                    possible += item.getPoints();
                    earned += finalScore;
                }
            }
        }

        double percent = possible > 0 ? (earned / possible) * 100.0 : 0.0;

        gradebook.setTotal(Gradebook.Total.builder()
                .earned(earned)
                .possible(possible)
                .percent(percent)
                .build());
    }

    /**
     * Get gradebook for a specific student in a course (aggregated from source
     * data).
     * 
     * @param courseId  The course ID
     * @param studentId The student ID
     * @return Gradebook response DTO
     */
    public GradebookResponse getStudentGradebook(String courseId, String studentId) {
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, studentId);

        // Aggregate grades from assignments and quizzes
        return aggregateStudentGrades(courseId, studentId);
    }

    /**
     * Aggregate student grades from assignments and quizzes directly.
     * 
     * @param courseId  The course ID
     * @param studentId The student ID
     * @return Gradebook response with aggregated data
     */
    private GradebookResponse aggregateStudentGrades(String courseId, String studentId) {
        List<GradebookResponse.GradeItemResponse> items = new ArrayList<>();
        double totalEarned = 0.0;
        double totalPossible = 0.0;

        // Get cached gradebook if it exists (for override scores)
        Optional<Gradebook> cachedGradebookOpt = gradebookRepository.findByCourseIdAndStudentId(courseId, studentId);

        // Get all published assignments for the course
        List<Assignment> assignments = assignmentRepository.findByCourseIdAndPublishedOrderByDueAtAsc(courseId, true);

        for (Assignment assignment : assignments) {
            Optional<Submission> submission = submissionRepository.findByAssignmentIdAndStudentId(assignment.getId(),
                    studentId);

            Double score = null;
            String status = "NOT_SUBMITTED";
            Instant gradedAt = null;
            String feedback = null;

            if (submission.isPresent()) {
                Submission sub = submission.get();
                if (sub.getStatus() == Submission.SubmissionStatus.SUBMITTED) {
                    status = "SUBMITTED";
                    if (sub.getGrade() != null) {
                        score = sub.getGrade().getPointsAwarded();
                        status = "GRADED";
                        gradedAt = sub.getGrade().getGradedAt();
                        feedback = sub.getGrade().getFeedback();
                    }
                } else {
                    status = "DRAFT";
                }
            }

            // Check for override score
            Double overrideScore = null;
            if (cachedGradebookOpt.isPresent()) {
                Gradebook cachedGradebook = cachedGradebookOpt.get();
                Optional<Gradebook.GradeItem> cachedItem = cachedGradebook.getItems().stream()
                        .filter(item -> item.getItemId().equals(assignment.getId()) &&
                                item.getType() == Gradebook.ItemType.ASSIGNMENT)
                        .findFirst();
                if (cachedItem.isPresent() && cachedItem.get().getOverrideScore() != null) {
                    overrideScore = cachedItem.get().getOverrideScore();
                    score = overrideScore;
                    status = "GRADED";
                }
            }

            items.add(GradebookResponse.GradeItemResponse.builder()
                    .type("ASSIGNMENT")
                    .itemId(assignment.getId())
                    .title(assignment.getTitle())
                    .score(score)
                    .points(assignment.getPoints())
                    .status(status)
                    .gradedAt(gradedAt)
                    .feedback(feedback)
                    .overrideScore(overrideScore)
                    .build());

            if (assignment.getPoints() != null && assignment.getPoints() > 0) {
                if (score != null && status.equals("GRADED")) {
                    totalPossible += assignment.getPoints();
                    totalEarned += score;
                }
            }
        }

        // Get all published quizzes for the course
        List<Quiz> quizzes = quizRepository.findByCourseIdAndPublishedOrderByCreatedAtDesc(courseId, true);

        for (Quiz quiz : quizzes) {
            // Get student's best attempt (or most recent submitted)
            Optional<QuizAttempt> attemptOpt = quizAttemptRepository
                    .findFirstByQuizIdAndStudentIdOrderByStartedAtDesc(quiz.getId(), studentId);

            Double score = null;
            String status = "NOT_SUBMITTED";
            Instant gradedAt = null;
            double quizTotalPoints = 0.0;
            Double overrideScore = null;

            // Calculate total points for quiz (using separate Question entities)
            List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(quiz.getId());
            if (!questions.isEmpty()) {
                quizTotalPoints = questions.stream()
                        .mapToDouble(q -> q.getPoints() != null ? q.getPoints() : 0.0)
                        .sum();
            }

            if (attemptOpt.isPresent()) {
                QuizAttempt attempt = attemptOpt.get();
                if (attempt.getStatus() == QuizAttempt.AttemptStatus.SUBMITTED) {
                    status = "SUBMITTED";
                    if (attempt.getScore() != null) {
                        score = attempt.getScore();
                        status = "GRADED";
                        gradedAt = attempt.getGradedAt() != null ? attempt.getGradedAt() : attempt.getSubmittedAt();
                    }
                } else {
                    status = "IN_PROGRESS";
                }
            }

            // Check for override score
            if (cachedGradebookOpt.isPresent()) {
                Gradebook cachedGradebook = cachedGradebookOpt.get();
                Optional<Gradebook.GradeItem> cachedItem = cachedGradebook.getItems().stream()
                        .filter(item -> item.getItemId().equals(quiz.getId()) &&
                                item.getType() == Gradebook.ItemType.QUIZ)
                        .findFirst();
                if (cachedItem.isPresent() && cachedItem.get().getOverrideScore() != null) {
                    overrideScore = cachedItem.get().getOverrideScore();
                    score = overrideScore;
                    status = "GRADED";
                }
            }

            items.add(GradebookResponse.GradeItemResponse.builder()
                    .type("QUIZ")
                    .itemId(quiz.getId())
                    .title(quiz.getTitle())
                    .score(score)
                    .points(quizTotalPoints > 0 ? quizTotalPoints : null)
                    .status(status)
                    .gradedAt(gradedAt)
                    .overrideScore(overrideScore)
                    .build());

            if (quizTotalPoints > 0) {
                if (score != null && status.equals("GRADED")) {
                    totalPossible += quizTotalPoints;
                    totalEarned += score;
                }
            }
        }

        double percent = totalPossible > 0 ? (totalEarned / totalPossible) * 100.0 : 0.0;

        return GradebookResponse.builder()
                .courseId(courseId)
                .studentId(studentId)
                .items(items)
                .total(GradebookResponse.TotalResponse.builder()
                        .earned(totalEarned)
                        .possible(totalPossible)
                        .percent(percent)
                        .build())
                .updatedAt(Instant.now())
                .build();
    }

    /**
     * Get all gradebooks for a course (instructor view). Aggregates from source
     * data.
     * 
     * @param courseId The course ID
     * @return List of gradebook responses for all students
     */
    public List<GradebookResponse> getAllGradebooks(String courseId) {
        // Get all enrolled students
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);

        return enrollments.stream()
                .filter(e -> e.getStatus() == Enrollment.EnrollmentStatus.ACTIVE)
                .map(e -> aggregateStudentGrades(courseId, e.getUserId()))
                .collect(Collectors.toList());
    }

    /**
     * Get gradebook view for instructor (table format with all students and items).
     * 
     * @param courseId The course ID
     * @return GradebookViewResponse with students and items matrix
     */
    /**
     * Get gradebook view for instructor (table format with all students and items).
     * 
     * @param courseId The course ID
     * @return GradebookViewResponse with students and items matrix
     */
    public GradebookViewResponse getGradebookView(String courseId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can view gradebook", 403);
        }

        // Get all enrolled students
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        List<String> studentIds = enrollments.stream()
                .filter(e -> e.getStatus() == Enrollment.EnrollmentStatus.ACTIVE
                        && e.getCourseRole() == Enrollment.CourseRole.STUDENT)
                .map(Enrollment::getUserId)
                .collect(Collectors.toList());

        // Get all published assignments and quizzes
        List<Assignment> assignments = assignmentRepository.findByCourseIdAndPublishedOrderByDueAtAsc(courseId, true);
        List<Quiz> quizzes = quizRepository.findByCourseIdAndPublishedOrderByCreatedAtDesc(courseId, true);

        // Pre-fetch all submissions for these assignments (bulk fetch)
        List<String> assignmentIds = assignments.stream().map(Assignment::getId).collect(Collectors.toList());
        List<Submission> allSubmissions = assignmentIds.isEmpty() ? new ArrayList<>()
                : submissionRepository.findByAssignmentIdIn(assignmentIds);

        // Map assignments' submissions by StudentID -> AssignmentID -> Submission
        Map<String, Map<String, Submission>> submissionMap = new HashMap<>(); // Student -> (Assignment -> Submission)
        for (Submission s : allSubmissions) {
            submissionMap.computeIfAbsent(s.getStudentId(), k -> new HashMap<>()).put(s.getAssignmentId(), s);
        }

        // Pre-fetch all quiz attempts (bulk fetch)
        List<String> quizIds = quizzes.stream().map(Quiz::getId).collect(Collectors.toList());
        List<QuizAttempt> allAttempts = quizIds.isEmpty() ? new ArrayList<>()
                : quizAttemptRepository.findByQuizIdIn(quizIds);

        // Map quiz attempts: StudentID -> QuizID -> Best Attempt (most recent started)
        Map<String, Map<String, QuizAttempt>> quizAttemptMap = new HashMap<>();
        // Group by Student -> Quiz -> List<Attempt>
        Map<String, Map<String, List<QuizAttempt>>> rawAttemptMap = new HashMap<>();
        for (QuizAttempt qa : allAttempts) {
            rawAttemptMap.computeIfAbsent(qa.getStudentId(), k -> new HashMap<>())
                    .computeIfAbsent(qa.getQuizId(), k -> new ArrayList<>())
                    .add(qa);
        }
        // Reduce to best attempt (simplistic: most recent started, just like original
        // code findFirstBy...OrderByStartedAtDesc)
        // Note: original code used findFirst...Desc, so we sort list or just pick max
        for (String sId : rawAttemptMap.keySet()) {
            for (String qId : rawAttemptMap.get(sId).keySet()) {
                List<QuizAttempt> attempts = rawAttemptMap.get(sId).get(qId);
                attempts.sort((a, b) -> b.getStartedAt().compareTo(a.getStartedAt())); // Descending
                quizAttemptMap.computeIfAbsent(sId, k -> new HashMap<>()).put(qId, attempts.get(0));
            }
        }

        // Pre-fetch all cached gradebooks for the course
        List<Gradebook> cachedGradebooks = gradebookRepository.findByCourseId(courseId);
        Map<String, Gradebook> cachedGradebookMap = cachedGradebooks.stream()
                .collect(Collectors.toMap(Gradebook::getStudentId, g -> g));

        // Build items list
        List<GradebookViewResponse.GradebookItem> items = new ArrayList<>();
        // Map to store quiz total points for fast lookup
        Map<String, Double> quizPointsMap = new HashMap<>();
        for (Quiz quiz : quizzes) {
            List<Question> qs = questionRepository.findByQuizIdOrderByPositionAsc(quiz.getId());
            double pts = qs.stream().mapToDouble(q -> q.getPoints() != null ? q.getPoints() : 0.0).sum();
            quizPointsMap.put(quiz.getId(), pts);
        }

        for (Assignment assignment : assignments) {
            items.add(GradebookViewResponse.GradebookItem.builder()
                    .itemId(assignment.getId())
                    .title(assignment.getTitle())
                    .type("ASSIGNMENT")
                    .points(assignment.getPoints())
                    .build());
        }

        for (Quiz quiz : quizzes) {
            items.add(GradebookViewResponse.GradebookItem.builder()
                    .itemId(quiz.getId())
                    .title(quiz.getTitle())
                    .type("QUIZ")
                    .points(quizPointsMap.getOrDefault(quiz.getId(), 0.0) > 0
                            ? quizPointsMap.getOrDefault(quiz.getId(), 0.0)
                            : null)
                    .build());
        }

        // Build student grades matrix
        List<GradebookViewResponse.StudentGradeRow> studentRows = new ArrayList<>();

        // Bulk fetch student names
        List<User> students = userRepository.findAllById(studentIds);
        Map<String, String> studentNameMap = students.stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        for (String studentId : studentIds) {
            Map<String, GradebookViewResponse.GradeCell> grades = new HashMap<>();
            double totalEarned = 0.0;
            double totalPossible = 0.0;

            Gradebook cachedGradebook = cachedGradebookMap.get(studentId);

            for (Assignment assignment : assignments) {
                // Get from pre-fetched map
                Submission submission = submissionMap.getOrDefault(studentId, new HashMap<>()).get(assignment.getId());

                Double score = null;
                String status = "NOT_SUBMITTED";
                if (submission != null) {
                    if (submission.getStatus() == Submission.SubmissionStatus.SUBMITTED) {
                        status = "SUBMITTED";
                        if (submission.getGrade() != null) {
                            score = submission.getGrade().getPointsAwarded();
                            status = "GRADED";
                        }
                    } else {
                        status = "DRAFT";
                    }
                }

                // Check for override score
                if (cachedGradebook != null) {
                    Optional<Gradebook.GradeItem> cachedItem = cachedGradebook.getItems().stream()
                            .filter(item -> item.getItemId().equals(assignment.getId()) &&
                                    item.getType() == Gradebook.ItemType.ASSIGNMENT)
                            .findFirst();
                    if (cachedItem.isPresent() && cachedItem.get().getOverrideScore() != null) {
                        score = cachedItem.get().getOverrideScore();
                        status = "GRADED";
                    }
                }

                grades.put(assignment.getId(), GradebookViewResponse.GradeCell.builder()
                        .score(score)
                        .points(assignment.getPoints())
                        .status(status)
                        .build());

                if (assignment.getPoints() != null && assignment.getPoints() > 0) {
                    if (score != null && status.equals("GRADED")) {
                        totalPossible += assignment.getPoints();
                        totalEarned += score;
                    }
                }
            }

            // Get quiz grades (check for override in cached gradebook)
            for (Quiz quiz : quizzes) {
                QuizAttempt attempt = quizAttemptMap.getOrDefault(studentId, new HashMap<>()).get(quiz.getId());

                Double score = null;
                String status = "NOT_SUBMITTED";
                double quizTotalPoints = quizPointsMap.getOrDefault(quiz.getId(), 0.0);

                if (attempt != null) {
                    if (attempt.getStatus() == QuizAttempt.AttemptStatus.SUBMITTED) {
                        status = "SUBMITTED";
                        if (attempt.getScore() != null) {
                            score = attempt.getScore();
                            status = "GRADED";
                        }
                    } else {
                        status = "IN_PROGRESS";
                    }
                }

                // Check for override score
                if (cachedGradebook != null) {
                    Optional<Gradebook.GradeItem> cachedItem = cachedGradebook.getItems().stream()
                            .filter(item -> item.getItemId().equals(quiz.getId()) &&
                                    item.getType() == Gradebook.ItemType.QUIZ)
                            .findFirst();
                    if (cachedItem.isPresent() && cachedItem.get().getOverrideScore() != null) {
                        score = cachedItem.get().getOverrideScore();
                        status = "GRADED";
                    }
                }

                grades.put(quiz.getId(), GradebookViewResponse.GradeCell.builder()
                        .score(score)
                        .points(quizTotalPoints > 0 ? quizTotalPoints : null)
                        .status(status)
                        .build());

                if (quizTotalPoints > 0) {
                    if (score != null && status.equals("GRADED")) {
                        totalPossible += quizTotalPoints;
                        totalEarned += score;
                    }
                }
            }

            double percent = totalPossible > 0 ? (totalEarned / totalPossible) * 100.0 : 0.0;

            String studentName = studentNameMap.getOrDefault(studentId, "Unknown Student");

            studentRows.add(GradebookViewResponse.StudentGradeRow.builder()
                    .studentId(studentId)
                    .studentName(studentName)
                    .grades(grades)
                    .totalEarned(totalEarned)
                    .totalPossible(totalPossible)
                    .percent(percent)
                    .build());
        }

        return GradebookViewResponse.builder()
                .courseId(courseId)
                .items(items)
                .students(studentRows)
                .build();
    }

    /**
     * Override a grade manually (instructor only).
     * 
     * @param courseId      The course ID
     * @param studentId     The student ID
     * @param itemId        The assignment or quiz ID
     * @param itemType      The item type ("ASSIGNMENT" or "QUIZ")
     * @param overrideScore The override score (null to remove override)
     */
    public void overrideGrade(String courseId, String studentId, String itemId, String itemType, Double overrideScore) {
        User currentUser = authService.getCurrentUser();

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can override grades", 403);
        }

        Gradebook gradebook = getOrCreateGradebook(courseId, studentId);

        // Find or create grade item
        Optional<Gradebook.GradeItem> itemOpt = gradebook.getItems().stream()
                .filter(item -> item.getItemId().equals(itemId) &&
                        item.getType() != null && item.getType().name().equals(itemType))
                .findFirst();

        Gradebook.GradeItem item;
        if (itemOpt.isPresent()) {
            item = itemOpt.get();
        } else {
            // Create new item
            String title = "Item";
            if ("ASSIGNMENT".equals(itemType)) {
                Assignment assignment = assignmentRepository.findById(itemId).orElse(null);
                title = assignment != null ? assignment.getTitle() : "Assignment";
            } else if ("QUIZ".equals(itemType)) {
                Quiz quiz = quizRepository.findById(itemId).orElse(null);
                title = quiz != null ? quiz.getTitle() : "Quiz";
            }

            item = Gradebook.GradeItem.builder()
                    .type(Gradebook.ItemType.valueOf(itemType))
                    .itemId(itemId)
                    .title(title)
                    .build();
            gradebook.getItems().add(item);
        }

        // Set override score
        item.setOverrideScore(overrideScore);

        // Recalculate totals (use override score if present, otherwise use regular
        // score)
        recalculateTotals(gradebook);

        gradebookRepository.save(gradebook);
        log.info("Grade overridden: item {} for student {} in course {} by user {}",
                itemId, studentId, courseId, currentUser.getId());
    }

    /**
     * Map Gradebook entity to GradebookResponse DTO.
     */
    private GradebookResponse mapToResponse(Gradebook gradebook) {
        List<GradebookResponse.GradeItemResponse> itemResponses = gradebook.getItems().stream()
                .map(item -> {
                    // Use override score if present, otherwise use regular score
                    Double finalScore = item.getOverrideScore() != null ? item.getOverrideScore() : item.getScore();

                    return GradebookResponse.GradeItemResponse.builder()
                            .type(item.getType() != null ? item.getType().name() : "UNKNOWN")
                            .itemId(item.getItemId())
                            .title(item.getTitle())
                            .score(finalScore)
                            .points(item.getPoints())
                            .status(item.getStatus())
                            .gradedAt(item.getGradedAt())
                            .feedback(item.getFeedback())
                            .overrideScore(item.getOverrideScore())
                            .build();
                })
                .collect(Collectors.toList());

        GradebookResponse.TotalResponse totalResponse = GradebookResponse.TotalResponse.builder()
                .earned(gradebook.getTotal().getEarned())
                .possible(gradebook.getTotal().getPossible())
                .percent(gradebook.getTotal().getPercent())
                .build();

        return GradebookResponse.builder()
                .id(gradebook.getId())
                .courseId(gradebook.getCourseId())
                .studentId(gradebook.getStudentId())
                .items(itemResponses)
                .total(totalResponse)
                .updatedAt(gradebook.getUpdatedAt())
                .build();
    }
}
