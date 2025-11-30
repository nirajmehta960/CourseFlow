package com.courseflow.calendar.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * CalendarEvent entity representing a calendar event.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "calendar_events")
@CompoundIndex(name = "course_start_idx", def = "{'courseId': 1, 'startAt': 1}")
public class CalendarEvent {
    
    @Id
    private String id;
    
    @Indexed
    private String courseId;
    
    /**
     * Type of event: ASSIGNMENT_DUE, QUIZ_DUE, or CUSTOM.
     */
    private EventType type;
    
    private String title;
    
    /**
     * Start date and time of the event.
     */
    @Indexed
    private Instant startAt;
    
    /**
     * End date and time of the event (optional).
     */
    private Instant endAt;
    
    /**
     * Reference ID to the assignment or quiz (for ASSIGNMENT_DUE and QUIZ_DUE types).
     * Null for CUSTOM events.
     */
    private String refId;
    
    /**
     * ID of the user who created this event (for CUSTOM events).
     * Null for auto-generated events.
     */
    private String createdBy;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
    
    /**
     * Event type enumeration.
     */
    public enum EventType {
        ASSIGNMENT_DUE,
        QUIZ_DUE,
        CUSTOM
    }
}
