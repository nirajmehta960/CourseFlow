package com.courseflow.grades.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Gradebook entity representing a student's grades for a course.
 * Optimized for fast grades page loading.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "gradebooks")
@CompoundIndex(name = "course_student_idx", def = "{'courseId': 1, 'studentId': 1}", unique = true)
public class Gradebook {
    
    @Id
    private String id;
    
    @Indexed
    private String courseId;
    
    @Indexed
    private String studentId;
    
    /**
     * Array of grade items (assignments and quizzes).
     */
    @Builder.Default
    private List<GradeItem> items = new ArrayList<>();
    
    /**
     * Total grade information.
     */
    @Builder.Default
    private Total total = Total.builder()
            .earned(0.0)
            .possible(0.0)
            .percent(0.0)
            .build();
    
    @LastModifiedDate
    private Instant updatedAt;
    
    /**
     * Grade item representing an assignment or quiz.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradeItem {
        /**
         * Type of grade item (ASSIGNMENT or QUIZ).
         */
        private ItemType type;
        
        /**
         * ID of the assignment or quiz.
         */
        private String itemId;
        
        /**
         * Title of the assignment or quiz.
         */
        private String title;
        
        /**
         * Score received by the student.
         */
        private Double score;
        
        /**
         * Maximum points possible.
         */
        private Double points;
        
        /**
         * Status of the item (e.g., "SUBMITTED", "GRADED", "NOT_SUBMITTED").
         */
        private String status;
        
        /**
         * Timestamp when the item was graded.
         */
        private Instant gradedAt;
    }
    
    /**
     * Item type enumeration.
     */
    public enum ItemType {
        ASSIGNMENT,
        QUIZ
    }
    
    /**
     * Total grade information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Total {
        /**
         * Total points earned.
         */
        private Double earned;
        
        /**
         * Total points possible.
         */
        private Double possible;
        
        /**
         * Percentage grade (0-100).
         */
        private Double percent;
    }
}


