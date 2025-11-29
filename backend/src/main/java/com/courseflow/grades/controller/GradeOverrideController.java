package com.courseflow.grades.controller;

import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.security.RequireInstructor;
import com.courseflow.grades.dto.GradeOverrideRequest;
import com.courseflow.grades.service.GradebookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for grade override endpoints.
 */
@RestController
@RequestMapping("/api/gradebook")
@RequiredArgsConstructor
@Tag(name = "Grades", description = "Gradebook management endpoints")
public class GradeOverrideController {
    
    private final GradebookService gradebookService;
    
    @PatchMapping("/override")
    @RequireInstructor
    @Operation(summary = "Override grade", description = "Manually override a grade for a student. Only instructors and TAs can override grades.")
    public ResponseEntity<ApiResponse<Void>> overrideGrade(
            @Valid @RequestBody GradeOverrideRequest request) {
        gradebookService.overrideGrade(
                request.getCourseId(),
                request.getStudentId(),
                request.getItemId(),
                request.getItemType(),
                request.getOverrideScore()
        );
        return ResponseEntity.ok(ApiResponse.success(null, "Grade overridden successfully"));
    }
}
