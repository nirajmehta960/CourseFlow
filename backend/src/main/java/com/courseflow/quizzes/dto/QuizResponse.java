package com.courseflow.quizzes.dto;

import com.courseflow.quizzes.model.Quiz;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for quiz data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponse {
    
    private String id;
    private String courseId;
    private String title;
    private String instructions;
    private Integer timeLimitMinutes;
    private Boolean published;
    private List<QuestionResponse> questions;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
    
    /**
     * Question response DTO.
     * Note: For students, correctAnswer should be hidden unless they've submitted.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private String questionId;
        private Quiz.QuestionType type;
        private String prompt;
        private List<String> options;
        private String correctAnswer; // May be null for students
        private Double points;
    }
}
