package com.courseflow.calendar.controller;

import com.courseflow.calendar.dto.CalendarEventRequest;
import com.courseflow.calendar.dto.CalendarEventResponse;
import com.courseflow.calendar.service.CalendarService;
import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.security.RequireInstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * Controller for calendar endpoints.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Calendar", description = "Calendar event management endpoints")
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping("/calendar")
    @Operation(summary = "Get calendar events", description = "Get calendar events for the logged-in user within a date range.")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getCalendarEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startAt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endAt) {
        List<CalendarEventResponse> events = calendarService.getCalendarEvents(startAt, endAt);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @PostMapping("/courses/{courseId}/calendar")
    @RequireInstructor
    @Operation(summary = "Create custom event", description = "Create a custom calendar event. Only instructors and TAs can create custom events.")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> createCustomEvent(
            @PathVariable String courseId,
            @Valid @RequestBody CalendarEventRequest request) {
        CalendarEventResponse event = calendarService.createCustomEvent(courseId, request);
        return ResponseEntity.ok(ApiResponse.success(event, "Calendar event created successfully"));
    }
}
