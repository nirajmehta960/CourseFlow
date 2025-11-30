package com.courseflow.calendar.repository;

import com.courseflow.calendar.model.CalendarEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository for CalendarEvent entity operations.
 */
@Repository
public interface CalendarEventRepository extends MongoRepository<CalendarEvent, String> {
    
    /**
     * Find all events for a course, ordered by start date.
     * 
     * @param courseId The course ID
     * @return List of events for the course
     */
    List<CalendarEvent> findByCourseIdOrderByStartAtAsc(String courseId);
    
    /**
     * Find events within a date range for a specific course.
     * 
     * @param courseId The course ID
     * @param startAt Start of date range (inclusive)
     * @param endAt End of date range (inclusive)
     * @return List of events in the date range
     */
    List<CalendarEvent> findByCourseIdAndStartAtBetweenOrderByStartAtAsc(
            String courseId, Instant startAt, Instant endAt);
    
    /**
     * Find events within a date range for multiple courses.
     * 
     * @param courseIds List of course IDs
     * @param startAt Start of date range (inclusive)
     * @param endAt End of date range (inclusive)
     * @return List of events in the date range
     */
    List<CalendarEvent> findByCourseIdInAndStartAtBetweenOrderByStartAtAsc(
            List<String> courseIds, Instant startAt, Instant endAt);
    
    /**
     * Find an auto-generated event by type and refId.
     * 
     * @param type The event type
     * @param refId The reference ID (assignment or quiz ID)
     * @return Optional event if found
     */
    Optional<CalendarEvent> findByTypeAndRefId(CalendarEvent.EventType type, String refId);
    
    /**
     * Delete all auto-generated events for a specific assignment or quiz.
     * 
     * @param type The event type
     * @param refId The reference ID
     */
    void deleteByTypeAndRefId(CalendarEvent.EventType type, String refId);
}
