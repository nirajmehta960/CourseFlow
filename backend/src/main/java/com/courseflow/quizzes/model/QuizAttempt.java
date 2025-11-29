package com.courseflow.quizzes.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * QuizAttempt entity representing a student's attempt at a quiz.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "quiz_attempts")
@CompoundIndex(name = "quiz_student_submitted_idx", def = "{'quizId': 1, 'studentId': 1, 'submittedAt': -1}")
@CompoundIndex(name = "course_student_idx", def = "{'courseId': 1, 'studentId': 1}")
public class QuizAttempt {
    
    @Id
    private String id;
    
    @Indexed
    private String courseId;
    
    @Indexed
    private String quizId;
    
    @Indexed
    private String studentId;
    
    /**
     * List of answers provided by the student.
     * Each answer corresponds to a question in the quiz.
     */
    @Builder.Default
    private List<Answer> answers = new ArrayList<>();
    
    /**
     * Timestamp when the attempt was started.
     */
    @CreatedDate
    private Instant startedAt;
    
    /**
     * Timestamp when the attempt was submitted (null if not yet submitted).
     */
    private Instant submittedAt;
    
    /**
     * Attempt status: IN_PROGRESS or SUBMITTED.
     */
    @Builder.Default
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;
    
    /**
     * Score received by the student (calculated on submission).
     */
    private Double score;
    
    /**
     * Timestamp when the attempt was graded (for short answer questions that need review).
     */
    private Instant gradedAt;
    
    /**
     * Attempt status enumeration.
     */
    public enum AttemptStatus {
        IN_PROGRESS,
        SUBMITTED
    }
    
    /**
     * Answer provided for a question.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Answer {
        /**
         * Question ID this answer corresponds to.
         */
        private String questionId;
        
        /**
         * Answer provided:
         * - MCQ: selected option index (0-based) as string
         * - TF: "true" or "false"
         * - SHORT: answer text
         */
        private String answer;
    }
}
