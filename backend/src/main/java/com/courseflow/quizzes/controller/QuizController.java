package com.courseflow.quizzes.controller;

import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.security.RequireInstructor;
import com.courseflow.quizzes.dto.QuizAttemptRequest;
import com.courseflow.quizzes.dto.QuizAttemptResponse;
import com.courseflow.quizzes.dto.QuizRequest;
import com.courseflow.quizzes.dto.QuizResponse;
import com.courseflow.quizzes.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for quiz endpoints.
 */
@RestController
@RequestMapping("/courses/{courseId}/quizzes")
@RequiredArgsConstructor
@Tag(name = "Quizzes", description = "Quiz management endpoints")
public class QuizController {
    
    private final QuizService quizService;
    
    @GetMapping
    @Operation(summary = "Get quizzes", description = "Get all quizzes for a course. User must be enrolled in the course.")
    public ResponseEntity<ApiResponse<List<QuizResponse>>> getQuizzes(
            @PathVariable String courseId) {
        List<QuizResponse> quizzes = quizService.getQuizzes(courseId);
        return ResponseEntity.ok(ApiResponse.success(quizzes));
    }
    
    @PostMapping
    @RequireInstructor
    @Operation(summary = "Create quiz", description = "Create a new quiz. Only instructors and TAs can create quizzes.")
    public ResponseEntity<ApiResponse<QuizResponse>> createQuiz(
            @PathVariable String courseId,
            @Valid @RequestBody QuizRequest request) {
        QuizResponse quiz = quizService.createQuiz(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(quiz, "Quiz created successfully"));
    }
    
    @GetMapping("/{quizId}")
    @Operation(summary = "Get quiz by ID", description = "Get quiz details. For students, correct answers are hidden unless they've submitted.")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuiz(
            @PathVariable String courseId,
            @PathVariable String quizId) {
        QuizResponse quiz = quizService.getQuiz(courseId, quizId);
        return ResponseEntity.ok(ApiResponse.success(quiz));
    }
    
    @PatchMapping("/{quizId}")
    @RequireInstructor
    @Operation(summary = "Update quiz", description = "Update quiz details. Only instructors and TAs can update quizzes.")
    public ResponseEntity<ApiResponse<QuizResponse>> updateQuiz(
            @PathVariable String courseId,
            @PathVariable String quizId,
            @Valid @RequestBody QuizRequest request) {
        QuizResponse quiz = quizService.updateQuiz(courseId, quizId, request);
        return ResponseEntity.ok(ApiResponse.success(quiz, "Quiz updated successfully"));
    }
    
    @DeleteMapping("/{quizId}")
    @RequireInstructor
    @Operation(summary = "Delete quiz", description = "Delete a quiz. Only instructors and TAs can delete quizzes.")
    public ResponseEntity<ApiResponse<Void>> deleteQuiz(
            @PathVariable String courseId,
            @PathVariable String quizId) {
        quizService.deleteQuiz(courseId, quizId);
        return ResponseEntity.ok(ApiResponse.success(null, "Quiz deleted successfully"));
    }
    
    @PostMapping("/{quizId}/start")
    @Operation(summary = "Start quiz attempt", description = "Start a new quiz attempt or return existing in-progress attempt.")
    public ResponseEntity<ApiResponse<QuizAttemptResponse>> startAttempt(
            @PathVariable String courseId,
            @PathVariable String quizId) {
        QuizAttemptResponse attempt = quizService.startAttempt(courseId, quizId);
        return ResponseEntity.ok(ApiResponse.success(attempt, "Quiz attempt started"));
    }
    
    @PostMapping("/{quizId}/attempts/{attemptId}/submit")
    @Operation(summary = "Submit quiz attempt", description = "Submit a quiz attempt. Score is calculated automatically.")
    public ResponseEntity<ApiResponse<QuizAttemptResponse>> submitAttempt(
            @PathVariable String courseId,
            @PathVariable String quizId,
            @PathVariable String attemptId,
            @Valid @RequestBody QuizAttemptRequest request) {
        QuizAttemptResponse attempt = quizService.submitAttempt(courseId, quizId, attemptId, request);
        return ResponseEntity.ok(ApiResponse.success(attempt, "Quiz submitted successfully"));
    }
    
    @GetMapping("/{quizId}/attempts/me")
    @Operation(summary = "Get my quiz attempts", description = "Get all quiz attempts for the current student.")
    public ResponseEntity<ApiResponse<List<QuizAttemptResponse>>> getMyAttempts(
            @PathVariable String courseId,
            @PathVariable String quizId) {
        List<QuizAttemptResponse> attempts = quizService.getMyAttempts(courseId, quizId);
        return ResponseEntity.ok(ApiResponse.success(attempts));
    }
    
    @GetMapping("/{quizId}/attempts")
    @RequireInstructor
    @Operation(summary = "Get all quiz attempts", description = "Get all quiz attempts for a quiz. Only instructors and TAs can view all attempts.")
    public ResponseEntity<ApiResponse<List<QuizAttemptResponse>>> getAllAttempts(
            @PathVariable String courseId,
            @PathVariable String quizId) {
        List<QuizAttemptResponse> attempts = quizService.getAllAttempts(courseId, quizId);
        return ResponseEntity.ok(ApiResponse.success(attempts));
    }
    
    @GetMapping("/{quizId}/my-attempt")
    @Operation(summary = "Get my quiz attempt", description = "Get student's current attempt (in-progress or most recent submitted).")
    public ResponseEntity<ApiResponse<QuizAttemptResponse>> getMyAttempt(
            @PathVariable String courseId,
            @PathVariable String quizId) {
        QuizAttemptResponse attempt = quizService.getMyAttempt(courseId, quizId);
        if (attempt == null) {
            return ResponseEntity.ok(ApiResponse.success(null, "No attempt found"));
        }
        return ResponseEntity.ok(ApiResponse.success(attempt));
    }
}
