package com.courseflow.assignments.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Submission entity representing a student's submission for an assignment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "submissions")
@CompoundIndex(name = "assignment_student_idx", def = "{'assignmentId': 1, 'studentId': 1}", unique = true)
@CompoundIndex(name = "course_student_idx", def = "{'courseId': 1, 'studentId': 1}")
public class Submission {
    
    @Id
    private String id;
    
    @Indexed
    private String courseId;
    
    @Indexed
    private String assignmentId;
    
    @Indexed
    private String studentId;
    
    /**
     * Submission status: DRAFT or SUBMITTED.
     */
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.DRAFT;
    
    /**
     * Text body of the submission (optional).
     */
    private String bodyText;
    
    /**
     * List of file URLs (for uploaded files).
     */
    @Builder.Default
    private List<String> fileUrls = new ArrayList<>();
    
    @CreatedDate
    private Instant submittedAt;
    
    /**
     * Grade information for this submission.
     */
    private Grade grade;
    
    /**
     * Submission status enum.
     */
    public enum SubmissionStatus {
        DRAFT,
        SUBMITTED
    }
    
    /**
     * Grade information nested object.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Grade {
        /**
         * Points awarded (out of assignment points).
         */
        private Double pointsAwarded;
        
        /**
         * Feedback from the grader.
         */
        private String feedback;
        
        /**
         * ID of the user who graded this submission.
         */
        private String gradedBy;
        
        /**
         * Timestamp when the submission was graded.
         */
        private Instant gradedAt;
    }
}


