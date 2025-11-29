package com.courseflow.quizzes.repository;

import com.courseflow.quizzes.model.Question;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Question entity operations.
 */
@Repository
public interface QuestionRepository extends MongoRepository<Question, String> {
    
    /**
     * Find all questions for a quiz, ordered by position.
     */
    List<Question> findByQuizIdOrderByPositionAsc(String quizId);
    
    /**
     * Find all questions for a quiz.
     */
    List<Question> findByQuizId(String quizId);
    
    /**
     * Delete all questions for a quiz.
     */
    void deleteByQuizId(String quizId);
    
    /**
     * Find question by quiz ID and position.
     */
    Optional<Question> findByQuizIdAndPosition(String quizId, Integer position);
}
