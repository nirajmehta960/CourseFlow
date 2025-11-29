package com.courseflow.quizzes.dto;

import com.courseflow.quizzes.model.Question;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for creating and updating quizzes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizRequest {
    
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;
    
    private String instructions;
    
    @Positive(message = "Time limit must be positive")
    private Integer timeLimitMinutes;
    
    /**
     * Due date and time for the quiz (optional).
     */
    private Instant dueAt;
    
    private Boolean published;
    
    @Valid
    @Builder.Default
    private List<QuestionRequest> questions = new ArrayList<>();
    
    /**
     * Question request DTO.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionRequest {
        private String id; // Optional, for updates
        
        @NotNull(message = "Question type is required")
        private Question.QuestionType type;
        
        @NotBlank(message = "Question prompt is required")
        @Size(max = 2000, message = "Prompt must be at most 2000 characters")
        private String prompt;
        
        @Builder.Default
        private List<String> options = new ArrayList<>();
        
        @NotBlank(message = "Correct answer is required")
        private String correctAnswer;
        
        @NotNull(message = "Points is required")
        @Positive(message = "Points must be positive")
        private Double points;
        
        private Integer position;
    }
}
