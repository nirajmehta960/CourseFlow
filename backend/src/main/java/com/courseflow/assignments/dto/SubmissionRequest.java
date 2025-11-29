package com.courseflow.assignments.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for submitting an assignment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionRequest {
    
    /**
     * Submission status: DRAFT or SUBMITTED.
     */
    private com.courseflow.assignments.model.Submission.SubmissionStatus status;
    
    /**
     * Text body of the submission (optional).
     */
    private String bodyText;
    
    /**
     * List of file URLs (for uploaded files, base64 encoded for now).
     */
    @Builder.Default
    private List<String> fileUrls = new ArrayList<>();
}


