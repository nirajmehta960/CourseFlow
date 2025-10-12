package com.courseflow.grades.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for gradebook data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradebookResponse {
    
    private String id;
    private String courseId;
    private String studentId;
    private List<GradeItemResponse> items;
    private TotalResponse total;
    private Instant updatedAt;
    
    /**
     * Grade item response DTO.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradeItemResponse {
        private String type; // "ASSIGNMENT" or "QUIZ"
        private String itemId;
        private String title;
        private Double score;
        private Double points;
        private String status;
        private Instant gradedAt;
    }
    
    /**
     * Total grade response DTO.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TotalResponse {
        private Double earned;
        private Double possible;
        private Double percent;
    }
}

