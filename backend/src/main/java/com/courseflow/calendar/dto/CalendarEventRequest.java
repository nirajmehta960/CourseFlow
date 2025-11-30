package com.courseflow.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Request DTO for creating a custom calendar event.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotNull(message = "Start date is required")
    private Instant startAt;
    
    private Instant endAt;
}
