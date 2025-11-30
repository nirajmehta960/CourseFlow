package com.courseflow.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response DTO for calendar event data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventResponse {
    
    private String id;
    private String courseId;
    private String type; // "ASSIGNMENT_DUE", "QUIZ_DUE", or "CUSTOM"
    private String title;
    private Instant startAt;
    private Instant endAt;
    private String refId; // Reference to assignment or quiz ID
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}
