package com.courseflow.quizzes.controller;

import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.security.RequireInstructor;
import com.courseflow.quizzes.dto.QuizAttemptRequest;
import com.courseflow.quizzes.dto.QuizAttemptResponse;
import com.courseflow.quizzes.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for quiz endpoints (Canvas-like structure, not nested under courses).
 */
@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@Tag(name = "Quizzes", description = "Quiz management endpoints")
public class QuizControllerNew {
    
    private final QuizService quizService;
    
    @PostMapping("/{quizId}/start")
    @Operation(summary = "Start quiz attempt", description = "Start a new quiz attempt or return existing in-progress attempt.")
    public ResponseEntity<ApiResponse<QuizAttemptResponse>> startAttempt(
            @PathVariable String quizId) {
        QuizAttemptResponse attempt = quizService.startAttemptById(quizId);
        return ResponseEntity.ok(ApiResponse.success(attempt, "Quiz attempt started"));
    }
    
    @PostMapping("/{quizId}/submit")
    @Operation(summary = "Submit quiz attempt", description = "Submit a quiz attempt. Score is calculated automatically.")
    public ResponseEntity<ApiResponse<QuizAttemptResponse>> submitAttempt(
            @PathVariable String quizId,
            @Valid @RequestBody QuizAttemptRequest request) {
        QuizAttemptResponse attempt = quizService.submitAttemptById(quizId, request);
        return ResponseEntity.ok(ApiResponse.success(attempt, "Quiz submitted successfully"));
    }
    
    @GetMapping("/{quizId}/my-attempt")
    @Operation(summary = "Get my quiz attempt", description = "Get student's current attempt (in-progress or most recent submitted).")
    public ResponseEntity<ApiResponse<QuizAttemptResponse>> getMyAttempt(
            @PathVariable String quizId) {
        QuizAttemptResponse attempt = quizService.getMyAttemptById(quizId);
        if (attempt == null) {
            return ResponseEntity.ok(ApiResponse.success(null, "No attempt found"));
        }
        return ResponseEntity.ok(ApiResponse.success(attempt));
    }
    
    @GetMapping("/{quizId}/attempts")
    @RequireInstructor
    @Operation(summary = "Get all quiz attempts", description = "Get all quiz attempts for a quiz. Only instructors and TAs can view all attempts.")
    public ResponseEntity<ApiResponse<List<QuizAttemptResponse>>> getAllAttempts(
            @PathVariable String quizId) {
        List<QuizAttemptResponse> attempts = quizService.getAllAttemptsById(quizId);
        return ResponseEntity.ok(ApiResponse.success(attempts));
    }
}
