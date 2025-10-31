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
     * Text answer for the submission (optional).
     */
    private String textAnswer;
    
    /**
     * List of attachment file names or URLs (future: file uploads).
     */
    @Builder.Default
    private List<String> attachments = new ArrayList<>();
}


