package com.courseflow.quizzes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for quiz attempt data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptResponse {
    
    private String id;
    private String courseId;
    private String quizId;
    private String studentId;
    private List<AnswerResponse> answers;
    private Instant startedAt;
    private Instant submittedAt;
    private com.courseflow.quizzes.model.QuizAttempt.AttemptStatus status;
    private Double score;
    private Instant gradedAt;
    
    /**
     * Answer response DTO.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerResponse {
        private String questionId;
        private String answer;
    }
}
