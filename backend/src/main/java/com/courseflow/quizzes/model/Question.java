package com.courseflow.quizzes.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Question entity representing a question in a quiz.
 * Separate document for each question (Canvas-like structure).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "questions")
@CompoundIndex(name = "quiz_position_idx", def = "{'quizId': 1, 'position': 1}")
public class Question {
    
    @Id
    private String id;
    
    @Indexed
    private String quizId;
    
    /**
     * Position/order of the question in the quiz.
     */
    private Integer position;
    
    /**
     * Type of question.
     */
    private QuestionType type;
    
    /**
     * Question prompt/text.
     */
    private String prompt;
    
    /**
     * Options for MCQ and MULTI_SELECT questions.
     */
    @Builder.Default
    private List<String> options = new ArrayList<>();
    
    /**
     * Correct answer(s):
     * - MCQ: single option index (0-based) as string
     * - MULTI_SELECT: comma-separated option indices (e.g., "0,2,3")
     * - TRUE_FALSE: "true" or "false"
     * - SHORT_ANSWER: expected answer string (for reference, auto-grading may use fuzzy matching)
     */
    private String correctAnswer;
    
    /**
     * Points for this question.
     */
    private Double points;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
    
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
