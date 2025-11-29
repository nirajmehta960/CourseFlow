package com.courseflow.quizzes.service;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.courses.repository.CourseRepository;
import com.courseflow.calendar.service.CalendarService;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.grades.service.GradebookService;
import com.courseflow.notifications.model.Notification;
import com.courseflow.notifications.service.NotificationService;
import com.courseflow.quizzes.dto.QuizAttemptRequest;
import com.courseflow.quizzes.dto.QuizAttemptResponse;
import com.courseflow.quizzes.dto.QuizRequest;
import com.courseflow.quizzes.dto.QuizResponse;
import com.courseflow.quizzes.model.Quiz;
import com.courseflow.quizzes.model.QuizAttempt;
import com.courseflow.quizzes.model.Question;
import com.courseflow.quizzes.repository.QuestionRepository;
import com.courseflow.quizzes.repository.QuizAttemptRepository;
import com.courseflow.quizzes.repository.QuizRepository;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for handling quiz operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuestionRepository questionRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;
    private final AuthService authService;
    private final GradebookService gradebookService;
    private final CalendarService calendarService;
    private final NotificationService notificationService;

    /**
     * Get all quizzes for a course.
     * 
     * @param courseId Course ID
     * @return List of quiz responses
     */
    public List<QuizResponse> getQuizzes(String courseId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Get quizzes for the course
        List<Quiz> quizzes = quizRepository.findByCourseIdOrderByCreatedAtDesc(courseId);

        // For students, hide correct answers unless they've submitted
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        boolean canViewAnswers = isInstructor || isAdmin;

        return quizzes.stream()
                .map(quiz -> {
                    List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(quiz.getId());
                    return mapToResponseWithQuestions(quiz, questions, canViewAnswers, currentUser.getId());
                })
                .collect(Collectors.toList());
    }

    /**
     * Create a quiz. Only instructors/admins can create quizzes.
     * 
     * @param courseId Course ID
     * @param request  Quiz creation request
     * @return Created quiz response
     */
    public QuizResponse createQuiz(String courseId, QuizRequest request) {
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
                    "Only instructors and admins can create quizzes", 403);
        }

        // Create quiz
        Quiz quiz = Quiz.builder()
                .id(UUID.randomUUID().toString())
                .courseId(courseId)
                .title(request.getTitle())
                .instructions(request.getInstructions())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .dueAt(request.getDueAt())
                .published(request.getPublished() != null ? request.getPublished() : false)
                .createdBy(currentUser.getId())
                .build();

        quiz = quizRepository.save(quiz);

        // Create separate Question entities
        List<Question> questionEntities = new ArrayList<>();
        for (int i = 0; i < request.getQuestions().size(); i++) {
            QuizRequest.QuestionRequest qReq = request.getQuestions().get(i);
            Question question = Question.builder()
                    .id(UUID.randomUUID().toString())
                    .quizId(quiz.getId())
                    .position(qReq.getPosition() != null ? qReq.getPosition() : i)
                    .type(qReq.getType())
                    .prompt(qReq.getPrompt())
                    .options(qReq.getOptions() != null ? new ArrayList<>(qReq.getOptions()) : new ArrayList<>())
                    .correctAnswer(qReq.getCorrectAnswer())
                    .points(qReq.getPoints())
                    .build();
            questionEntities.add(questionRepository.save(question));
        }

        log.info("Quiz created: {} by user {} in course {} with {} questions",
                quiz.getId(), currentUser.getId(), courseId, questionEntities.size());

        // Sync calendar event
        calendarService.syncQuizEvent(quiz);

        return mapToResponseWithQuestions(quiz, questionEntities, true, currentUser.getId());
    }

    /**
     * Get quiz by ID. Verifies user is enrolled in the course.
     * For students, hides correct answers unless they've submitted.
     * 
     * @param courseId Course ID
     * @param quizId   Quiz ID
     * @return Quiz response
     */
    public QuizResponse getQuiz(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Verify quiz exists and belongs to course
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));

        if (!courseId.equals(quiz.getCourseId())) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found in this course", 404);
        }

        // Check if student has submitted (can view answers)
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        boolean canViewAnswers = isInstructor || isAdmin;

        // If student, check if they've submitted
        if (!canViewAnswers) {
            boolean hasSubmitted = quizAttemptRepository
                    .existsByQuizIdAndStudentIdAndSubmittedAtIsNotNull(quizId, currentUser.getId());
            canViewAnswers = hasSubmitted;
        }

        // Get questions
        List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(quizId);

        return mapToResponseWithQuestions(quiz, questions, canViewAnswers, currentUser.getId());
    }

    /**
     * Update a quiz. Only instructors/admins can update quizzes.
     * 
     * @param courseId Course ID
     * @param quizId   Quiz ID
     * @param request  Quiz update request
     * @return Updated quiz response
     */
    public QuizResponse updateQuiz(String courseId, String quizId, QuizRequest request) {
        User currentUser = authService.getCurrentUser();

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can update quizzes", 403);
        }

        // Get quiz
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));

        // Verify quiz belongs to course
        if (!courseId.equals(quiz.getCourseId())) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found in this course", 404);
        }

        // Check if students have already submitted attempts
        long submittedAttempts = quizAttemptRepository
                .findByQuizIdOrderBySubmittedAtDesc(quizId).stream()
                .filter(attempt -> attempt.getSubmittedAt() != null)
                .count();

        if (submittedAttempts > 0) {
            log.warn("Updating quiz {} with {} submitted attempts. This may affect existing scores.",
                    quizId, submittedAttempts);
        }

        // Update quiz fields
        quiz.setTitle(request.getTitle());
        quiz.setInstructions(request.getInstructions());
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        quiz.setDueAt(request.getDueAt());
        if (request.getPublished() != null) {
            quiz.setPublished(request.getPublished());
        }

        quiz = quizRepository.save(quiz);

        // Update questions (delete old, create new)
        questionRepository.deleteByQuizId(quizId);
        List<Question> questionEntities = new ArrayList<>();
        for (int i = 0; i < request.getQuestions().size(); i++) {
            QuizRequest.QuestionRequest qReq = request.getQuestions().get(i);
            Question question = Question.builder()
                    .id(UUID.randomUUID().toString())
                    .quizId(quiz.getId())
                    .position(qReq.getPosition() != null ? qReq.getPosition() : i)
                    .type(qReq.getType())
                    .prompt(qReq.getPrompt())
                    .options(qReq.getOptions() != null ? new ArrayList<>(qReq.getOptions()) : new ArrayList<>())
                    .correctAnswer(qReq.getCorrectAnswer())
                    .points(qReq.getPoints())
                    .build();
            questionEntities.add(questionRepository.save(question));
        }

        log.info("Quiz updated: {} by user {} in course {} with {} questions",
                quizId, currentUser.getId(), courseId, questionEntities.size());

        // Sync calendar event
        calendarService.syncQuizEvent(quiz);

        // Notify students if quiz is published (and wasn't before)
        if (quiz.getPublished()) {
            Quiz oldQuiz = quizRepository.findById(quizId).orElse(null);
            if (oldQuiz == null || !oldQuiz.getPublished()) {
                // Newly published quiz - notify students
                notificationService.notifyCourseStudents(
                        courseId,
                        currentUser.getId(),
                        Notification.NotificationType.NEW_QUIZ,
                        "New Quiz: " + quiz.getTitle(),
                        "A new quiz has been posted in your course.",
                        "/courses/" + courseId + "/quizzes/" + quiz.getId());
            }
        }

        return mapToResponseWithQuestions(quiz, questionEntities, true, currentUser.getId());
    }

    /**
     * Delete a quiz. Only instructors/admins can delete quizzes.
     * 
     * @param courseId Course ID
     * @param quizId   Quiz ID
     */
    public void deleteQuiz(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can delete quizzes", 403);
        }

        // Verify quiz exists and belongs to course
        if (!quizRepository.existsByIdAndCourseId(quizId, courseId)) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404);
        }

        // Delete questions first
        questionRepository.deleteByQuizId(quizId);

        // Delete calendar event
        calendarService.deleteQuizEvent(quizId);

        // Delete quiz (attempts will remain for historical record, but can be cleaned
        // up if needed)
        quizRepository.deleteById(quizId);
        log.info("Quiz deleted: {} by user {} in course {}",
                quizId, currentUser.getId(), courseId);
    }

    /**
     * Start a quiz attempt. Creates a new attempt or returns existing in-progress
     * attempt.
     * 
     * @param courseId Course ID
     * @param quizId   Quiz ID
     * @return Quiz attempt response
     */
    public QuizAttemptResponse startAttempt(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment (student must be enrolled)
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Verify quiz exists and belongs to course
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));

        if (!courseId.equals(quiz.getCourseId())) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found in this course", 404);
        }

        // Check if quiz is published
        if (!quiz.getPublished()) {
            throw new ApiException("QUIZ_NOT_PUBLISHED", "Quiz is not published", 403);
        }

        // Check for existing in-progress attempt
        Optional<QuizAttempt> existingAttempt = quizAttemptRepository
                .findByQuizIdAndStudentIdAndStatus(quizId, currentUser.getId(), QuizAttempt.AttemptStatus.IN_PROGRESS);

        if (existingAttempt.isPresent()) {
            return mapToAttemptResponse(existingAttempt.get());
        }

        // Create new attempt
        QuizAttempt attempt = QuizAttempt.builder()
                .id(UUID.randomUUID().toString())
                .courseId(courseId)
                .quizId(quizId)
                .studentId(currentUser.getId())
                .answers(new ArrayList<>())
                .status(QuizAttempt.AttemptStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .build();

        attempt = quizAttemptRepository.save(attempt);
        log.info("Quiz attempt started: quiz {} by student {} in course {}",
                quizId, currentUser.getId(), courseId);

        return mapToAttemptResponse(attempt);
    }

    /**
     * Submit a quiz attempt. Calculates score automatically and updates gradebook.
     * 
     * @param courseId  Course ID
     * @param quizId    Quiz ID
     * @param attemptId Attempt ID
     * @param request   Quiz attempt request with answers
     * @return Submitted quiz attempt response with score
     */
    public QuizAttemptResponse submitAttempt(String courseId, String quizId, String attemptId,
            QuizAttemptRequest request) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Verify quiz exists and belongs to course
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));

        if (!courseId.equals(quiz.getCourseId())) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found in this course", 404);
        }

        // Verify attempt exists and belongs to student
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ApiException("QUIZ_ATTEMPT_NOT_FOUND", "Quiz attempt not found", 404));

        if (!quizId.equals(attempt.getQuizId())) {
            throw new ApiException("QUIZ_ATTEMPT_NOT_FOUND", "Quiz attempt not found for this quiz", 404);
        }

        if (!currentUser.getId().equals(attempt.getStudentId())) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "You can only submit your own quiz attempts", 403);
        }

        // Check if already submitted
        if (attempt.getStatus() == QuizAttempt.AttemptStatus.SUBMITTED) {
            throw new ApiException("ATTEMPT_ALREADY_SUBMITTED",
                    "This quiz attempt has already been submitted", 409);
        }

        // Map answers from request
        List<QuizAttempt.Answer> answers = request.getAnswers().stream()
                .map(a -> QuizAttempt.Answer.builder()
                        .questionId(a.getQuestionId())
                        .answer(a.getAnswer())
                        .build())
                .collect(Collectors.toList());

        attempt.setAnswers(answers);
        attempt.setSubmittedAt(Instant.now());
        attempt.setStatus(QuizAttempt.AttemptStatus.SUBMITTED);

        // Get questions for auto-grading
        List<Question> questions = questionRepository.findByQuizIdOrderByPositionAsc(quizId);

        // Calculate score with auto-grading
        AutoGradeResult gradeResult = autoGradeAttempt(questions, answers);
        attempt.setScore(gradeResult.getScore());

        // If all questions are auto-graded, set gradedAt; otherwise leave null for
        // manual review
        if (gradeResult.isFullyGraded()) {
            attempt.setGradedAt(Instant.now());
        }

        attempt = quizAttemptRepository.save(attempt);
        log.info("Quiz attempt submitted: attempt {} for quiz {} by student {} with score {}/{} (needs review: {})",
                attemptId, quizId, currentUser.getId(), gradeResult.getScore(), calculateTotalPoints(questions),
                !gradeResult.isFullyGraded());

        // Update gradebook on quiz submission
        double totalPoints = calculateTotalPoints(questions);
        gradebookService.updateGradebookOnQuizSubmission(courseId, currentUser.getId(), quizId,
                gradeResult.getScore(), totalPoints, quiz.getTitle());

        // Notify student about quiz grade if fully auto-graded
        if (gradeResult.isFullyGraded()) {
            notificationService.notifyUser(
                    currentUser.getId(),
                    Notification.NotificationType.GRADE_POSTED,
                    "Quiz Graded: " + quiz.getTitle(),
                    "Your quiz has been automatically graded. Score: " + gradeResult.getScore() + " / " + totalPoints,
                    "/courses/" + courseId + "/quizzes/" + quizId);
        }

        return mapToAttemptResponse(attempt);
    }

    /**
     * Get student's attempts for a quiz.
     * 
     * @param courseId Course ID
     * @param quizId   Quiz ID
     * @return List of quiz attempt responses
     */
    public List<QuizAttemptResponse> getMyAttempts(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Verify quiz exists and belongs to course
        if (!quizRepository.existsByIdAndCourseId(quizId, courseId)) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404);
        }

        // Get student's attempts
        List<QuizAttempt> attempts = quizAttemptRepository
                .findByQuizIdAndStudentIdOrderBySubmittedAtDesc(quizId, currentUser.getId());

        return attempts.stream()
                .map(this::mapToAttemptResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all attempts for a quiz. Only instructors can view all attempts.
     * 
     * @param courseId Course ID
     * @param quizId   Quiz ID
     * @return List of quiz attempt responses
     */
    public List<QuizAttemptResponse> getAllAttempts(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);

        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS",
                    "Only instructors and admins can view all attempts", 403);
        }

        // Verify quiz exists and belongs to course
        if (!quizRepository.existsByIdAndCourseId(quizId, courseId)) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404);
        }

        // Get all attempts for the quiz
        List<QuizAttempt> attempts = quizAttemptRepository
                .findByQuizIdOrderBySubmittedAtDesc(quizId);

        return attempts.stream()
                .map(this::mapToAttemptResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get student's current attempt for a quiz by ID (without courseId in path).
     * 
     * @param quizId Quiz ID
     * @return Quiz attempt response or null if no attempt exists
     */
    public QuizAttemptResponse getMyAttemptById(String quizId) {
        User currentUser = authService.getCurrentUser();

        // Get quiz
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));

        // Verify enrollment
        enrollmentService.verifyEnrollment(quiz.getCourseId(), currentUser.getId());

        // Get most recent attempt (in-progress or submitted)
        Optional<QuizAttempt> attempt = quizAttemptRepository
                .findFirstByQuizIdAndStudentIdOrderByStartedAtDesc(quizId, currentUser.getId());

        if (attempt.isEmpty()) {
            return null;
        }

        return mapToAttemptResponse(attempt.get());
    }

    /**
     * Start a quiz attempt by ID (without courseId in path).
     * 
     * @param quizId Quiz ID
     * @return Quiz attempt response
     */
    public QuizAttemptResponse startAttemptById(String quizId) {
        User currentUser = authService.getCurrentUser();

        // Get quiz
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));

        return startAttempt(quiz.getCourseId(), quizId);
    }

    /**
     * Submit a quiz attempt by ID (without courseId in path).
     * 
     * @param quizId  Quiz ID
     * @param request Quiz attempt request with answers
     * @return Submitted quiz attempt response with score
     */
    public QuizAttemptResponse submitAttemptById(String quizId, QuizAttemptRequest request) {
        User currentUser = authService.getCurrentUser();

        // Get quiz
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));

        // Get in-progress attempt
        Optional<QuizAttempt> attemptOpt = quizAttemptRepository
                .findByQuizIdAndStudentIdAndStatus(quizId, currentUser.getId(), QuizAttempt.AttemptStatus.IN_PROGRESS);

        if (attemptOpt.isEmpty()) {
            throw new ApiException("QUIZ_ATTEMPT_NOT_FOUND", "No in-progress attempt found", 404);
        }

        return submitAttempt(quiz.getCourseId(), quizId, attemptOpt.get().getId(), request);
    }

    /**
     * Get all attempts for a quiz by ID (without courseId in path).
     * 
     * @param quizId Quiz ID
     * @return List of quiz attempt responses
     */
    public List<QuizAttemptResponse> getAllAttemptsById(String quizId) {
        User currentUser = authService.getCurrentUser();

        // Get quiz
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));

        return getAllAttempts(quiz.getCourseId(), quizId);
    }

    /**
     * Get student's current attempt for a quiz (in-progress or most recent
     * submitted).
     * 
     * @param courseId Course ID
     * @param quizId   Quiz ID
     * @return Quiz attempt response or null if no attempt exists
     */
    public QuizAttemptResponse getMyAttempt(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();

        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());

        // Verify quiz exists and belongs to course
        if (!quizRepository.existsByIdAndCourseId(quizId, courseId)) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404);
        }

        // Get most recent attempt (in-progress or submitted)
        Optional<QuizAttempt> attempt = quizAttemptRepository
                .findFirstByQuizIdAndStudentIdOrderByStartedAtDesc(quizId, currentUser.getId());

        if (attempt.isEmpty()) {
            return null;
        }

        return mapToAttemptResponse(attempt.get());
    }

    /**
     * Auto-grade a quiz attempt. Returns score and whether all questions were
     * auto-graded.
     * 
     * @param questions List of questions
     * @param answers   Student's answers
     * @return AutoGradeResult with score and fullyGraded flag
     */
    private AutoGradeResult autoGradeAttempt(List<Question> questions, List<QuizAttempt.Answer> answers) {
        double totalScore = 0.0;
        boolean fullyGraded = true;

        // Create a map of answers by question ID for quick lookup
        var answerMap = answers.stream()
                .collect(Collectors.toMap(
                        QuizAttempt.Answer::getQuestionId,
                        QuizAttempt.Answer::getAnswer,
                        (a, b) -> a // In case of duplicates, keep first
                ));

        // Check each question
        for (Question question : questions) {
            String studentAnswer = answerMap.get(question.getId());
            if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
                continue; // No answer provided, skip (0 points)
            }

            boolean isCorrect = false;
            boolean canAutoGrade = true;

            switch (question.getType()) {
                case MCQ:
                    // Compare selected option index
                    try {
                        int selectedIndex = Integer.parseInt(studentAnswer.trim());
                        int correctIndex = Integer.parseInt(question.getCorrectAnswer().trim());
                        isCorrect = (selectedIndex == correctIndex);
                    } catch (NumberFormatException e) {
                        isCorrect = false;
                    }
                    break;

                case MULTI_SELECT:
                    // Compare sets of selected indices
                    try {
                        String[] selectedIndices = studentAnswer.trim().split(",");
                        String[] correctIndices = question.getCorrectAnswer().trim().split(",");

                        java.util.Set<String> selectedSet = new java.util.HashSet<>(
                                java.util.Arrays.asList(selectedIndices));
                        java.util.Set<String> correctSet = new java.util.HashSet<>(
                                java.util.Arrays.asList(correctIndices));

                        isCorrect = selectedSet.equals(correctSet);
                    } catch (Exception e) {
                        isCorrect = false;
                    }
                    break;

                case TRUE_FALSE:
                    // Compare boolean values (case-insensitive)
                    isCorrect = question.getCorrectAnswer().trim().equalsIgnoreCase(studentAnswer.trim());
                    break;

                case SHORT_ANSWER:
                    // Mark as "needs review" - don't auto-grade
                    canAutoGrade = false;
                    fullyGraded = false;
                    // Could implement fuzzy matching here in the future
                    break;
            }

            if (canAutoGrade && isCorrect) {
                totalScore += question.getPoints();
            }
        }

        return new AutoGradeResult(totalScore, fullyGraded);
    }

    /**
     * Result of auto-grading operation.
     */
    private static class AutoGradeResult {
        private final double score;
        private final boolean fullyGraded;

        public AutoGradeResult(double score, boolean fullyGraded) {
            this.score = score;
            this.fullyGraded = fullyGraded;
        }

        public double getScore() {
            return score;
        }

        public boolean isFullyGraded() {
            return fullyGraded;
        }
    }

    /**
     * Calculate score for a quiz attempt based on answers (legacy method for
     * embedded questions).
     * 
     * @param quiz    The quiz with questions and correct answers
     * @param answers The student's answers
     * @return Total score earned
     */
    private double calculateScore(Quiz quiz, List<QuizAttempt.Answer> answers) {
        double totalScore = 0.0;

        // Create a map of answers by question ID for quick lookup
        var answerMap = answers.stream()
                .collect(Collectors.toMap(
                        QuizAttempt.Answer::getQuestionId,
                        QuizAttempt.Answer::getAnswer,
                        (a, b) -> a // In case of duplicates, keep first
                ));

        // Check each question (legacy embedded questions)
        for (Quiz.Question question : quiz.getQuestions()) {
            String studentAnswer = answerMap.get(question.getQuestionId());
            if (studentAnswer == null) {
                continue; // No answer provided, skip (0 points)
            }

            boolean isCorrect = false;

            switch (question.getType()) {
                case MCQ:
                    // Compare selected option index
                    try {
                        int selectedIndex = Integer.parseInt(studentAnswer);
                        int correctIndex = Integer.parseInt(question.getCorrectAnswer());
                        isCorrect = (selectedIndex == correctIndex);
                    } catch (NumberFormatException e) {
                        // Invalid answer format
                        isCorrect = false;
                    }
                    break;

                case TRUE_FALSE:
                    // Compare boolean values (case-insensitive)
                    isCorrect = question.getCorrectAnswer().trim().equalsIgnoreCase(studentAnswer.trim());
                    break;

                case SHORT_ANSWER:
                    // Simple string match (case-insensitive, trimmed)
                    // Future: could implement fuzzy matching
                    isCorrect = question.getCorrectAnswer().trim().equalsIgnoreCase(studentAnswer.trim());
                    break;

                case MULTI_SELECT:
                    // Compare comma-separated indices
                    try {
                        String[] selectedIndices = studentAnswer.split(",");
                        String[] correctIndices = question.getCorrectAnswer().split(",");
                        // Sort and compare
                        java.util.Arrays.sort(selectedIndices);
                        java.util.Arrays.sort(correctIndices);
                        isCorrect = java.util.Arrays.equals(selectedIndices, correctIndices);
                    } catch (Exception e) {
                        isCorrect = false;
                    }
                    break;
            }

            if (isCorrect) {
                totalScore += question.getPoints();
            }
        }

        return totalScore;
    }

    /**
     * Calculate total points for a quiz (using separate questions).
     * 
     * @param questions List of questions
     * @return Total points possible
     */
    private double calculateTotalPoints(List<Question> questions) {
        return questions.stream()
                .mapToDouble(Question::getPoints)
                .sum();
    }

    /**
     * Calculate total points for a quiz (legacy method for embedded questions).
     * 
     * @param quiz The quiz
     * @return Total points possible
     */
    private double calculateTotalPoints(Quiz quiz) {
        return quiz.getQuestions().stream()
                .mapToDouble(Quiz.Question::getPoints)
                .sum();
    }

    /**
     * Map Quiz entity to QuizResponse DTO (using separate questions).
     */
    private QuizResponse mapToResponseWithQuestions(Quiz quiz, List<Question> questions,
            boolean includeCorrectAnswers, String studentId) {
        List<QuizResponse.QuestionResponse> questionResponses = questions.stream()
                .map(q -> QuizResponse.QuestionResponse.builder()
                        .id(q.getId())
                        .position(q.getPosition())
                        .type(q.getType())
                        .prompt(q.getPrompt())
                        .options(q.getOptions() != null ? new ArrayList<>(q.getOptions()) : new ArrayList<>())
                        .correctAnswer(includeCorrectAnswers ? q.getCorrectAnswer() : null)
                        .points(q.getPoints())
                        .build())
                .collect(Collectors.toList());

        return QuizResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourseId())
                .title(quiz.getTitle())
                .instructions(quiz.getInstructions())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .dueAt(quiz.getDueAt())
                .published(quiz.getPublished())
                .questions(questionResponses)
                .createdBy(quiz.getCreatedBy())
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .build();
    }

    /**
     * Map Quiz entity to QuizResponse DTO (legacy method for embedded questions).
     */
    private QuizResponse mapToResponse(Quiz quiz, boolean includeCorrectAnswers, String studentId) {
        // This method is for legacy embedded questions - should not be used if
        // questions are separate entities
        // If quiz has no embedded questions, return empty list
        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            return QuizResponse.builder()
                    .id(quiz.getId())
                    .courseId(quiz.getCourseId())
                    .title(quiz.getTitle())
                    .instructions(quiz.getInstructions())
                    .timeLimitMinutes(quiz.getTimeLimitMinutes())
                    .dueAt(quiz.getDueAt())
                    .published(quiz.getPublished())
                    .questions(new ArrayList<>())
                    .createdBy(quiz.getCreatedBy())
                    .createdAt(quiz.getCreatedAt())
                    .updatedAt(quiz.getUpdatedAt())
                    .build();
        }

        List<QuizResponse.QuestionResponse> questionResponses = quiz.getQuestions().stream()
                .map(q -> {
                    // Convert Quiz.QuestionType to Question.QuestionType
                    Question.QuestionType questionType = Question.QuestionType.valueOf(q.getType().name());
                    return QuizResponse.QuestionResponse.builder()
                            .id(q.getQuestionId())
                            .type(questionType)
                            .prompt(q.getPrompt())
                            .options(q.getOptions() != null ? new ArrayList<>(q.getOptions()) : new ArrayList<>())
                            .correctAnswer(includeCorrectAnswers ? q.getCorrectAnswer() : null)
                            .points(q.getPoints())
                            .build();
                })
                .collect(Collectors.toList());

        return QuizResponse.builder()
                .id(quiz.getId())
                .courseId(quiz.getCourseId())
                .title(quiz.getTitle())
                .instructions(quiz.getInstructions())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .dueAt(quiz.getDueAt())
                .published(quiz.getPublished())
                .questions(questionResponses)
                .createdBy(quiz.getCreatedBy())
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .build();
    }

    /**
     * Map QuizAttempt entity to QuizAttemptResponse DTO.
     */
    private QuizAttemptResponse mapToAttemptResponse(QuizAttempt attempt) {
        List<QuizAttempt.Answer> answers = attempt.getAnswers();
        if (answers == null) {
            answers = new ArrayList<>();
        }

        List<QuizAttemptResponse.AnswerResponse> answerResponses = answers.stream()
                .filter(a -> a != null)
                .map(a -> QuizAttemptResponse.AnswerResponse.builder()
                        .questionId(a.getQuestionId())
                        .answer(a.getAnswer())
                        .build())
                .collect(Collectors.toList());

        return QuizAttemptResponse.builder()
                .id(attempt.getId())
                .courseId(attempt.getCourseId())
                .quizId(attempt.getQuizId())
                .studentId(attempt.getStudentId())
                .answers(answerResponses)
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .status(attempt.getStatus())
                .score(attempt.getScore())
                .gradedAt(attempt.getGradedAt())
                .build();
    }
}
