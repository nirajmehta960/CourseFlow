package com.courseflow.grades.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for instructor gradebook view (table format).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradebookViewResponse {

    private String courseId;
    private List<GradebookItem> items;
    private List<StudentGradeRow> students;

    /**
     * Gradebook item (assignment or quiz).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradebookItem {
        private String itemId;
        private String title;
        private String type; // "ASSIGNMENT" or "QUIZ"
        private Double points;
    }

    /**
     * Student grade row with grades for all items.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentGradeRow {
        private String studentId;
        private String studentName;
        private Map<String, GradeCell> grades; // itemId -> grade cell
        private Double totalEarned;
        private Double totalPossible;
        private Double percent;
    }

    /**
     * Grade cell for a specific item.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradeCell {
        private Double score;
        private Double points;
        private String status; // "GRADED", "SUBMITTED", "NOT_SUBMITTED", etc.
    }
}
