package com.courseflow.assignments.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for submission data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {
    
    private String id;
    private String courseId;
    private String assignmentId;
    private String studentId;
    private String textAnswer;
    
    @Builder.Default
    private List<String> attachments = new ArrayList<>();
    
    private Instant submittedAt;
    private GradeInfo grade;
    
    /**
     * Grade information nested object.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradeInfo {
        private Double score;
        private String feedback;
        private String gradedBy;
        private Instant gradedAt;
    }
}


