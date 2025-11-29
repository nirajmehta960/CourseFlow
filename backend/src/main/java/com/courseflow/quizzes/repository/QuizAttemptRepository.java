package com.courseflow.quizzes.repository;

import com.courseflow.quizzes.model.QuizAttempt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for QuizAttempt entity operations.
 */
@Repository
public interface QuizAttemptRepository extends MongoRepository<QuizAttempt, String> {
    
    /**
     * Find all attempts for a quiz, ordered by submission time (newest first).
     * 
     * @param quizId The quiz ID
     * @return List of quiz attempts
     */
    List<QuizAttempt> findByQuizIdOrderBySubmittedAtDesc(String quizId);
    
    /**
     * Find all attempts by a student for a quiz, ordered by submission time (newest first).
     * 
     * @param quizId The quiz ID
     * @param studentId The student ID
     * @return List of quiz attempts
     */
    List<QuizAttempt> findByQuizIdAndStudentIdOrderBySubmittedAtDesc(String quizId, String studentId);
    
    /**
     * Find all attempts by a student for a course.
     * 
     * @param courseId The course ID
     * @param studentId The student ID
     * @return List of quiz attempts
     */
    List<QuizAttempt> findByCourseIdAndStudentIdOrderBySubmittedAtDesc(String courseId, String studentId);
    
    /**
     * Check if a student has any submitted attempts for a quiz.
     * 
     * @param quizId The quiz ID
     * @param studentId The student ID
     * @return true if student has submitted attempts, false otherwise
     */
    boolean existsByQuizIdAndStudentIdAndSubmittedAtIsNotNull(String quizId, String studentId);
    
    /**
     * Find the most recent attempt (submitted or in-progress) for a student on a quiz.
     * 
     * @param quizId The quiz ID
     * @param studentId The student ID
     * @return Optional quiz attempt
     */
    Optional<QuizAttempt> findFirstByQuizIdAndStudentIdOrderByStartedAtDesc(String quizId, String studentId);
    
    /**
     * Find in-progress attempt for a student on a quiz.
     * 
     * @param quizId The quiz ID
     * @param studentId The student ID
     * @return Optional quiz attempt
     */
    Optional<QuizAttempt> findByQuizIdAndStudentIdAndStatus(String quizId, String studentId, QuizAttempt.AttemptStatus status);
}
