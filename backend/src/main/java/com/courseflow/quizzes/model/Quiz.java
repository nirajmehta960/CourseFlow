package com.courseflow.quizzes.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Quiz entity representing a quiz in a course.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "quizzes")
public class Quiz {
    
    @Id
    private String id;
    
    @Indexed
    private String courseId;
    
    private String title;
    
    private String instructions;
    
    /**
     * Time limit in minutes (optional, null means no time limit).
     */
    private Integer timeLimitMinutes;
    
    /**
     * Due date and time for the quiz (optional).
     */
    private Instant dueAt;
    
    /**
     * Whether the quiz is published and visible to students.
     */
    @Builder.Default
    private Boolean published = false;
    
    /**
     * List of questions in the quiz.
     */
    @Builder.Default
    private List<Question> questions = new ArrayList<>();
    
    /**
     * ID of the user who created this quiz.
     */
    @Indexed
    private String createdBy;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
    
    /**
     * Question embedded in a quiz.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Question {
        /**
         * Unique identifier for the question within the quiz.
         */
        private String questionId;
        
        /**
         * Type of question: MCQ (Multiple Choice), TF (True/False), SHORT (Short Answer).
         */
        private QuestionType type;
        
        /**
         * Question prompt/text.
         */
        private String prompt;
        
        /**
         * Options for MCQ questions (null for other types).
         */
        @Builder.Default
        private List<String> options = new ArrayList<>();
        
        /**
         * Correct answer:
         * - MCQ: index of correct option (0-based)
         * - TF: "true" or "false"
         * - SHORT: expected answer string
         */
        private String correctAnswer;
        
        /**
         * Points for this question.
         */
        private Double points;
    }
    
    /**
     * Question type enumeration.
     */
    public enum QuestionType {
        MCQ,           // Multiple Choice Question (single answer)
        MULTI_SELECT,  // Multiple Select (multiple answers)
        TRUE_FALSE,    // True/False
        SHORT_ANSWER   // Short Answer
    }
}
