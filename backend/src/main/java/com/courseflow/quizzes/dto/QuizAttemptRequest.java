package com.courseflow.quizzes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for submitting a quiz attempt.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptRequest {
    
    @Valid
    @NotEmpty(message = "Answers are required")
    @NotNull(message = "Answers are required")
    @Builder.Default
    private List<AnswerRequest> answers = new ArrayList<>();
    
    /**
     * Answer request DTO.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerRequest {
        @NotNull(message = "Question ID is required")
        private String questionId;
        
        private String answer; // Can be null for unanswered questions
    }
}
