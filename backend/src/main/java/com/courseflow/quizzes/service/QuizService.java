package com.courseflow.quizzes.service;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.courses.repository.CourseRepository;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.grades.service.GradebookService;
import com.courseflow.quizzes.dto.QuizAttemptRequest;
import com.courseflow.quizzes.dto.QuizAttemptResponse;
import com.courseflow.quizzes.dto.QuizRequest;
import com.courseflow.quizzes.dto.QuizResponse;
import com.courseflow.quizzes.model.Quiz;
import com.courseflow.quizzes.model.QuizAttempt;
import com.courseflow.quizzes.repository.QuizAttemptRepository;
import com.courseflow.quizzes.repository.QuizRepository;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
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
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;
    private final AuthService authService;
    private final GradebookService gradebookService;
    
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
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        boolean canViewAnswers = isInstructor || isAdmin;
        
        return quizzes.stream()
                .map(quiz -> mapToResponse(quiz, canViewAnswers, currentUser.getId()))
                .collect(Collectors.toList());
    }
    
    /**
     * Create a quiz. Only instructors/admins can create quizzes.
     * 
     * @param courseId Course ID
     * @param request Quiz creation request
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
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can create quizzes", 403);
        }
        
        // Map questions from request
        List<Quiz.Question> questions = request.getQuestions().stream()
                .map(q -> Quiz.Question.builder()
                        .questionId(q.getQuestionId())
                        .type(q.getType())
                        .prompt(q.getPrompt())
                        .options(q.getOptions() != null ? new ArrayList<>(q.getOptions()) : new ArrayList<>())
                        .correctAnswer(q.getCorrectAnswer())
                        .points(q.getPoints())
                        .build())
                .collect(Collectors.toList());
        
        // Create quiz
        Quiz quiz = Quiz.builder()
                .courseId(courseId)
                .title(request.getTitle())
                .instructions(request.getInstructions())
                .timeLimitMinutes(request.getTimeLimitMinutes())
                .published(request.getPublished() != null ? request.getPublished() : false)
                .questions(questions)
                .createdBy(currentUser.getId())
                .build();
        
        quiz = quizRepository.save(quiz);
        log.info("Quiz created: {} by user {} in course {}", 
                quiz.getId(), currentUser.getId(), courseId);
        
        return mapToResponse(quiz, true, currentUser.getId());
    }
    
    /**
     * Get quiz by ID. Verifies user is enrolled in the course.
     * For students, hides correct answers unless they've submitted.
     * 
     * @param courseId Course ID
     * @param quizId Quiz ID
     * @return Quiz response
     */
    public QuizResponse getQuiz(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Verify quiz exists and belongs to course
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));
        
        if (!quiz.getCourseId().equals(courseId)) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found in this course", 404);
        }
        
        // Check if student has submitted (can view answers)
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        boolean canViewAnswers = isInstructor || isAdmin;
        
        // If student, check if they've submitted
        if (!canViewAnswers) {
            boolean hasSubmitted = quizAttemptRepository
                    .existsByQuizIdAndStudentIdAndSubmittedAtIsNotNull(quizId, currentUser.getId());
            canViewAnswers = hasSubmitted;
        }
        
        return mapToResponse(quiz, canViewAnswers, currentUser.getId());
    }
    
    /**
     * Update a quiz. Only instructors/admins can update quizzes.
     * 
     * @param courseId Course ID
     * @param quizId Quiz ID
     * @param request Quiz update request
     * @return Updated quiz response
     */
    public QuizResponse updateQuiz(String courseId, String quizId, QuizRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can update quizzes", 403);
        }
        
        // Get quiz
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));
        
        // Verify quiz belongs to course
        if (!quiz.getCourseId().equals(courseId)) {
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
        
        // Map questions from request
        List<Quiz.Question> questions = request.getQuestions().stream()
                .map(q -> Quiz.Question.builder()
                        .questionId(q.getQuestionId())
                        .type(q.getType())
                        .prompt(q.getPrompt())
                        .options(q.getOptions() != null ? new ArrayList<>(q.getOptions()) : new ArrayList<>())
                        .correctAnswer(q.getCorrectAnswer())
                        .points(q.getPoints())
                        .build())
                .collect(Collectors.toList());
        
        // Update quiz fields
        quiz.setTitle(request.getTitle());
        quiz.setInstructions(request.getInstructions());
        quiz.setTimeLimitMinutes(request.getTimeLimitMinutes());
        if (request.getPublished() != null) {
            quiz.setPublished(request.getPublished());
        }
        quiz.setQuestions(questions);
        
        quiz = quizRepository.save(quiz);
        log.info("Quiz updated: {} by user {} in course {}", 
                quizId, currentUser.getId(), courseId);
        
        return mapToResponse(quiz, true, currentUser.getId());
    }
    
    /**
     * Delete a quiz. Only instructors/admins can delete quizzes.
     * 
     * @param courseId Course ID
     * @param quizId Quiz ID
     */
    public void deleteQuiz(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can delete quizzes", 403);
        }
        
        // Verify quiz exists and belongs to course
        if (!quizRepository.existsByIdAndCourseId(quizId, courseId)) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404);
        }
        
        // Delete quiz (attempts will remain for historical record, but can be cleaned up if needed)
        quizRepository.deleteById(quizId);
        log.info("Quiz deleted: {} by user {} in course {}", 
                quizId, currentUser.getId(), courseId);
    }
    
    /**
     * Start a quiz attempt. Creates a new attempt or returns existing in-progress attempt.
     * 
     * @param courseId Course ID
     * @param quizId Quiz ID
     * @return Quiz attempt response
     */
    public QuizAttemptResponse startAttempt(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment (student must be enrolled)
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Verify quiz exists and belongs to course
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ApiException("QUIZ_NOT_FOUND", "Quiz not found", 404));
        
        if (!quiz.getCourseId().equals(courseId)) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found in this course", 404);
        }
        
        // Check if quiz is published
        if (!quiz.getPublished()) {
            throw new ApiException("QUIZ_NOT_PUBLISHED", "Quiz is not published", 403);
        }
        
        // Check for existing in-progress attempt
        Optional<QuizAttempt> existingAttempt = quizAttemptRepository
                .findFirstByQuizIdAndStudentIdOrderByStartedAtDesc(quizId, currentUser.getId());
        
        if (existingAttempt.isPresent()) {
            QuizAttempt attempt = existingAttempt.get();
            // If not yet submitted, return existing attempt
            if (attempt.getSubmittedAt() == null) {
                return mapToAttemptResponse(attempt);
            }
        }
        
        // Create new attempt
        QuizAttempt attempt = QuizAttempt.builder()
                .courseId(courseId)
                .quizId(quizId)
                .studentId(currentUser.getId())
                .answers(new ArrayList<>())
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
     * @param courseId Course ID
     * @param quizId Quiz ID
     * @param attemptId Attempt ID
     * @param request Quiz attempt request with answers
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
        
        if (!quiz.getCourseId().equals(courseId)) {
            throw new ApiException("QUIZ_NOT_FOUND", "Quiz not found in this course", 404);
        }
        
        // Verify attempt exists and belongs to student
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ApiException("QUIZ_ATTEMPT_NOT_FOUND", "Quiz attempt not found", 404));
        
        if (!attempt.getQuizId().equals(quizId)) {
            throw new ApiException("QUIZ_ATTEMPT_NOT_FOUND", "Quiz attempt not found for this quiz", 404);
        }
        
        if (!attempt.getStudentId().equals(currentUser.getId())) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "You can only submit your own quiz attempts", 403);
        }
        
        // Check if already submitted
        if (attempt.getSubmittedAt() != null) {
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
        
        // Calculate score
        double score = calculateScore(quiz, answers);
        attempt.setScore(score);
        
        attempt = quizAttemptRepository.save(attempt);
        log.info("Quiz attempt submitted: attempt {} for quiz {} by student {} with score {}/{}", 
                attemptId, quizId, currentUser.getId(), score, calculateTotalPoints(quiz));
        
        // Update gradebook on quiz submission
        double totalPoints = calculateTotalPoints(quiz);
        gradebookService.updateGradebookOnQuizSubmission(courseId, currentUser.getId(), quizId, 
                score, totalPoints, quiz.getTitle());
        
        return mapToAttemptResponse(attempt);
    }
    
    /**
     * Get student's attempts for a quiz.
     * 
     * @param courseId Course ID
     * @param quizId Quiz ID
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
     * @param quizId Quiz ID
     * @return List of quiz attempt responses
     */
    public List<QuizAttemptResponse> getAllAttempts(String courseId, String quizId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
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
     * Calculate score for a quiz attempt based on answers.
     * 
     * @param quiz The quiz with questions and correct answers
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
        
        // Check each question
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
                    
                case TF:
                    // Compare boolean values (case-insensitive)
                    isCorrect = question.getCorrectAnswer().trim().equalsIgnoreCase(studentAnswer.trim());
                    break;
                    
                case SHORT:
                    // Simple string match (case-insensitive, trimmed)
                    // Future: could implement fuzzy matching
                    isCorrect = question.getCorrectAnswer().trim().equalsIgnoreCase(studentAnswer.trim());
                    break;
            }
            
            if (isCorrect) {
                totalScore += question.getPoints();
            }
        }
        
        return totalScore;
    }
    
    /**
     * Calculate total points for a quiz.
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
     * Map Quiz entity to QuizResponse DTO.
     */
    private QuizResponse mapToResponse(Quiz quiz, boolean includeCorrectAnswers, String studentId) {
        List<QuizResponse.QuestionResponse> questionResponses = quiz.getQuestions().stream()
                .map(q -> QuizResponse.QuestionResponse.builder()
                        .questionId(q.getQuestionId())
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
        List<QuizAttemptResponse.AnswerResponse> answerResponses = attempt.getAnswers().stream()
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
                .score(attempt.getScore())
                .build();
    }
}
