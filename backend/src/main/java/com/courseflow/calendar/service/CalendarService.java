package com.courseflow.calendar.service;

import com.courseflow.assignments.model.Assignment;
import com.courseflow.assignments.repository.AssignmentRepository;
import com.courseflow.auth.service.AuthService;
import com.courseflow.calendar.dto.CalendarEventRequest;
import com.courseflow.calendar.dto.CalendarEventResponse;
import com.courseflow.calendar.model.CalendarEvent;
import com.courseflow.calendar.repository.CalendarEventRepository;
import com.courseflow.common.error.ApiException;
import com.courseflow.enrollments.repository.EnrollmentRepository;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.quizzes.model.Quiz;
import com.courseflow.quizzes.repository.QuizRepository;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for handling calendar event operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarService {
    
    private final CalendarEventRepository calendarEventRepository;
    private final AssignmentRepository assignmentRepository;
    private final QuizRepository quizRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AuthService authService;
    private final EnrollmentService enrollmentService;
    
    /**
     * Get calendar events for the logged-in user within a date range.
     * 
     * @param startAt Start of date range (optional, defaults to start of current month)
     * @param endAt End of date range (optional, defaults to end of current month)
     * @return List of calendar events
     */
    public List<CalendarEventResponse> getCalendarEvents(Instant startAt, Instant endAt) {
        User currentUser = authService.getCurrentUser();
        
        // Get all courses the user is enrolled in
        List<String> courseIds = enrollmentRepository.findByUserId(currentUser.getId()).stream()
                .map(enrollment -> enrollment.getCourseId())
                .collect(Collectors.toList());
        
        if (courseIds.isEmpty()) {
            return List.of();
        }
        
        // If date range not provided, default to current month
        if (startAt == null || endAt == null) {
            Instant now = Instant.now();
            startAt = now.minusSeconds(30L * 24 * 60 * 60); // 30 days ago
            endAt = now.plusSeconds(60L * 24 * 60 * 60); // 60 days from now
        }
        
        // Get events for all enrolled courses within date range
        List<CalendarEvent> events = calendarEventRepository
                .findByCourseIdInAndStartAtBetweenOrderByStartAtAsc(courseIds, startAt, endAt);
        
        return events.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Create a custom calendar event (instructor only).
     * 
     * @param courseId The course ID
     * @param request The event request
     * @return Created event response
     */
    public CalendarEventResponse createCustomEvent(String courseId, CalendarEventRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Check permission: must be instructor/TA or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and TAs can create custom calendar events", 403);
        }
        
        CalendarEvent event = CalendarEvent.builder()
                .id(UUID.randomUUID().toString())
                .courseId(courseId)
                .type(CalendarEvent.EventType.CUSTOM)
                .title(request.getTitle())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .refId(null)
                .createdBy(currentUser.getId())
                .build();
        
        event = calendarEventRepository.save(event);
        
        log.info("Created custom calendar event: {} in course {} by user {}", 
                event.getId(), courseId, currentUser.getId());
        
        return mapToResponse(event);
    }
    
    /**
     * Auto-generate calendar events for assignments with due dates.
     * This should be called when an assignment is created or updated.
     * 
     * @param assignment The assignment
     */
    public void syncAssignmentEvent(Assignment assignment) {
        if (assignment.getDueAt() == null) {
            // Remove existing event if due date is removed
            calendarEventRepository.deleteByTypeAndRefId(
                    CalendarEvent.EventType.ASSIGNMENT_DUE, assignment.getId());
            return;
        }
        
        // Check if event already exists
        Optional<CalendarEvent> existingEvent = calendarEventRepository
                .findByTypeAndRefId(CalendarEvent.EventType.ASSIGNMENT_DUE, assignment.getId());
        
        CalendarEvent event;
        if (existingEvent.isPresent()) {
            // Update existing event
            event = existingEvent.get();
            event.setTitle(assignment.getTitle() + " Due");
            event.setStartAt(assignment.getDueAt());
            event.setEndAt(null);
        } else {
            // Create new event
            event = CalendarEvent.builder()
                    .id(UUID.randomUUID().toString())
                    .courseId(assignment.getCourseId())
                    .type(CalendarEvent.EventType.ASSIGNMENT_DUE)
                    .title(assignment.getTitle() + " Due")
                    .startAt(assignment.getDueAt())
                    .endAt(null)
                    .refId(assignment.getId())
                    .createdBy(null) // Auto-generated
                    .build();
        }
        
        calendarEventRepository.save(event);
        log.debug("Synced calendar event for assignment: {}", assignment.getId());
    }
    
    /**
     * Auto-generate calendar events for quizzes with due dates.
     * This should be called when a quiz is created or updated.
     * 
     * @param quiz The quiz
     */
    public void syncQuizEvent(Quiz quiz) {
        if (quiz.getDueAt() == null) {
            // Remove existing event if due date is removed
            calendarEventRepository.deleteByTypeAndRefId(
                    CalendarEvent.EventType.QUIZ_DUE, quiz.getId());
            return;
        }
        
        // Check if event already exists
        Optional<CalendarEvent> existingEvent = calendarEventRepository
                .findByTypeAndRefId(CalendarEvent.EventType.QUIZ_DUE, quiz.getId());
        
        CalendarEvent event;
        if (existingEvent.isPresent()) {
            // Update existing event
            event = existingEvent.get();
            event.setTitle(quiz.getTitle() + " Due");
            event.setStartAt(quiz.getDueAt());
            event.setEndAt(null);
        } else {
            // Create new event
            event = CalendarEvent.builder()
                    .id(UUID.randomUUID().toString())
                    .courseId(quiz.getCourseId())
                    .type(CalendarEvent.EventType.QUIZ_DUE)
                    .title(quiz.getTitle() + " Due")
                    .startAt(quiz.getDueAt())
                    .endAt(null)
                    .refId(quiz.getId())
                    .createdBy(null) // Auto-generated
                    .build();
        }
        
        calendarEventRepository.save(event);
        log.debug("Synced calendar event for quiz: {}", quiz.getId());
    }
    
    /**
     * Delete calendar event for an assignment (when assignment is deleted).
     * 
     * @param assignmentId The assignment ID
     */
    public void deleteAssignmentEvent(String assignmentId) {
        calendarEventRepository.deleteByTypeAndRefId(
                CalendarEvent.EventType.ASSIGNMENT_DUE, assignmentId);
        log.debug("Deleted calendar event for assignment: {}", assignmentId);
    }
    
    /**
     * Delete calendar event for a quiz (when quiz is deleted).
     * 
     * @param quizId The quiz ID
     */
    public void deleteQuizEvent(String quizId) {
        calendarEventRepository.deleteByTypeAndRefId(
                CalendarEvent.EventType.QUIZ_DUE, quizId);
        log.debug("Deleted calendar event for quiz: {}", quizId);
    }
    
    /**
     * Map CalendarEvent entity to CalendarEventResponse DTO.
     */
    private CalendarEventResponse mapToResponse(CalendarEvent event) {
        return CalendarEventResponse.builder()
                .id(event.getId())
                .courseId(event.getCourseId())
                .type(event.getType().name())
                .title(event.getTitle())
                .startAt(event.getStartAt())
                .endAt(event.getEndAt())
                .refId(event.getRefId())
                .createdBy(event.getCreatedBy())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
