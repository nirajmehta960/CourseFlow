package com.courseflow.courses.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for course statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseStats {

    private Long totalStudents;
    private Long submissionsPending;
}
