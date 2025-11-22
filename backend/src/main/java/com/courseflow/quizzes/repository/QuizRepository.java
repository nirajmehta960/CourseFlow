package com.courseflow.quizzes.repository;

import com.courseflow.quizzes.model.Quiz;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Quiz entity operations.
 */
@Repository
public interface QuizRepository extends MongoRepository<Quiz, String> {
    
    /**
     * Find all quizzes for a course, ordered by creation date (newest first).
     * 
     * @param courseId The course ID
     * @return List of quizzes for the course
     */
    List<Quiz> findByCourseIdOrderByCreatedAtDesc(String courseId);
    
    /**
     * Find all published quizzes for a course.
     * 
     * @param courseId The course ID
     * @param published Published status
     * @return List of published quizzes
     */
    List<Quiz> findByCourseIdAndPublishedOrderByCreatedAtDesc(String courseId, Boolean published);
    
    /**
     * Check if a quiz exists in a course.
     * 
     * @param courseId The course ID
     * @param quizId The quiz ID
     * @return true if quiz exists in the course, false otherwise
     */
    boolean existsByIdAndCourseId(String quizId, String courseId);
}
