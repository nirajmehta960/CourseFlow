package com.courseflow.grades.service;

import com.courseflow.assignments.model.Assignment;
import com.courseflow.assignments.repository.AssignmentRepository;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.grades.dto.GradebookResponse;
import com.courseflow.grades.model.Gradebook;
import com.courseflow.grades.repository.GradebookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for handling gradebook operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GradebookService {
    
    private final GradebookRepository gradebookRepository;
    private final AssignmentRepository assignmentRepository;
    private final EnrollmentService enrollmentService;
    
    /**
     * Get or create gradebook for a course and student.
     * 
     * @param courseId The course ID
     * @param studentId The student ID
     * @return Gradebook entity
     */
    private Gradebook getOrCreateGradebook(String courseId, String studentId) {
        Optional<Gradebook> existing = gradebookRepository.findByCourseIdAndStudentId(courseId, studentId);
        
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Create new gradebook
        Gradebook gradebook = Gradebook.builder()
                .courseId(courseId)
                .studentId(studentId)
                .items(new ArrayList<>())
                .total(Gradebook.Total.builder()
                        .earned(0.0)
                        .possible(0.0)
                        .percent(0.0)
                        .build())
                .build();
        
        try {
            gradebook = gradebookRepository.save(gradebook);
            log.debug("Created new gradebook for student {} in course {}", studentId, courseId);
        } catch (DuplicateKeyException e) {
            // Race condition: another thread created it, fetch it
            gradebook = gradebookRepository.findByCourseIdAndStudentId(courseId, studentId)
                    .orElseThrow(() -> new RuntimeException("Failed to create gradebook"));
        }
        
        return gradebook;
    }
    
    /**
     * Update gradebook when a student submits an assignment.
     * 
     * @param courseId The course ID
     * @param studentId The student ID
     * @param assignmentId The assignment ID
     * @param status The status (typically "SUBMITTED")
     */
    public void updateGradebookOnSubmission(String courseId, String studentId, String assignmentId, String status) {
        // Get assignment to retrieve title and points
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElse(null);
        
        if (assignment == null) {
            log.warn("Assignment {} not found when updating gradebook", assignmentId);
            return;
        }
        
        Gradebook gradebook = getOrCreateGradebook(courseId, studentId);
        
        // Find existing item or create new one
        Optional<Gradebook.GradeItem> existingItemOpt = gradebook.getItems().stream()
                .filter(item -> item.getItemId().equals(assignmentId) && 
                               item.getType() == Gradebook.ItemType.ASSIGNMENT)
                .findFirst();
        
        if (existingItemOpt.isPresent()) {
            // Update existing item
            Gradebook.GradeItem item = existingItemOpt.get();
            item.setStatus(status);
            item.setPoints(assignment.getPoints());
            if (item.getTitle() == null || item.getTitle().isBlank()) {
                item.setTitle(assignment.getTitle());
            }
        } else {
            // Create new item
            Gradebook.GradeItem newItem = Gradebook.GradeItem.builder()
                    .type(Gradebook.ItemType.ASSIGNMENT)
                    .itemId(assignmentId)
                    .title(assignment.getTitle())
                    .score(null)
                    .points(assignment.getPoints())
                    .status(status)
                    .gradedAt(null)
                    .build();
            
            gradebook.getItems().add(newItem);
        }
        
        gradebookRepository.save(gradebook);
        log.debug("Updated gradebook for student {} in course {} on assignment submission", 
                studentId, courseId);
    }
    
    /**
     * Update gradebook when an instructor grades a submission.
     * 
     * @param courseId The course ID
     * @param studentId The student ID
     * @param assignmentId The assignment ID
     * @param score The score received
     * @param points The maximum points possible
     */
    public void updateGradebookOnGrade(String courseId, String studentId, String assignmentId, 
                                       Double score, Double points) {
        Gradebook gradebook = getOrCreateGradebook(courseId, studentId);
        
        // Get assignment for title
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElse(null);
        String title = assignment != null ? assignment.getTitle() : "Assignment";
        
        // Find existing item or create new one
        Optional<Gradebook.GradeItem> existingItemOpt = gradebook.getItems().stream()
                .filter(item -> item.getItemId().equals(assignmentId) && 
                               item.getType() == Gradebook.ItemType.ASSIGNMENT)
                .findFirst();
        
        Gradebook.GradeItem item;
        if (existingItemOpt.isPresent()) {
            item = existingItemOpt.get();
        } else {
            // Create new item if it doesn't exist
            item = Gradebook.GradeItem.builder()
                    .type(Gradebook.ItemType.ASSIGNMENT)
                    .itemId(assignmentId)
                    .title(title)
                    .build();
            gradebook.getItems().add(item);
        }
        
        // Update item with grade information
        item.setScore(score);
        item.setPoints(points);
        item.setStatus("GRADED");
        item.setGradedAt(Instant.now());
        if (item.getTitle() == null || item.getTitle().isBlank()) {
            item.setTitle(title);
        }
        
        // Recalculate totals
        recalculateTotals(gradebook);
        
        gradebookRepository.save(gradebook);
        log.debug("Updated gradebook for student {} in course {} on assignment grade", 
                studentId, courseId);
    }
    
    /**
     * Recalculate totals for a gradebook based on all items.
     * 
     * @param gradebook The gradebook to recalculate
     */
    public void recalculateTotals(Gradebook gradebook) {
        double earned = 0.0;
        double possible = 0.0;
        
        for (Gradebook.GradeItem item : gradebook.getItems()) {
            if (item.getPoints() != null && item.getPoints() > 0) {
                possible += item.getPoints();
                
                // Only count score if it's been graded
                if (item.getScore() != null && item.getStatus() != null && 
                    item.getStatus().equals("GRADED")) {
                    earned += item.getScore();
                }
            }
        }
        
        double percent = possible > 0 ? (earned / possible) * 100.0 : 0.0;
        
        gradebook.setTotal(Gradebook.Total.builder()
                .earned(earned)
                .possible(possible)
                .percent(percent)
                .build());
    }
    
    /**
     * Get gradebook for a specific student in a course.
     * 
     * @param courseId The course ID
     * @param studentId The student ID
     * @return Gradebook response DTO
     */
    public GradebookResponse getStudentGradebook(String courseId, String studentId) {
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, studentId);
        
        Gradebook gradebook = gradebookRepository.findByCourseIdAndStudentId(courseId, studentId)
                .orElse(Gradebook.builder()
                        .courseId(courseId)
                        .studentId(studentId)
                        .items(new ArrayList<>())
                        .total(Gradebook.Total.builder()
                                .earned(0.0)
                                .possible(0.0)
                                .percent(0.0)
                                .build())
                        .build());
        
        return mapToResponse(gradebook);
    }
    
    /**
     * Get all gradebooks for a course. Only instructors can view all gradebooks.
     * 
     * @param courseId The course ID
     * @return List of gradebook responses
     */
    public List<GradebookResponse> getAllGradebooks(String courseId) {
        List<Gradebook> gradebooks = gradebookRepository.findByCourseId(courseId);
        
        // If no gradebooks exist, return empty list (don't create them automatically)
        return gradebooks.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Map Gradebook entity to GradebookResponse DTO.
     */
    private GradebookResponse mapToResponse(Gradebook gradebook) {
        List<GradebookResponse.GradeItemResponse> itemResponses = gradebook.getItems().stream()
                .map(item -> GradebookResponse.GradeItemResponse.builder()
                        .type(item.getType().name())
                        .itemId(item.getItemId())
                        .title(item.getTitle())
                        .score(item.getScore())
                        .points(item.getPoints())
                        .status(item.getStatus())
                        .gradedAt(item.getGradedAt())
                        .build())
                .collect(Collectors.toList());
        
        GradebookResponse.TotalResponse totalResponse = GradebookResponse.TotalResponse.builder()
                .earned(gradebook.getTotal().getEarned())
                .possible(gradebook.getTotal().getPossible())
                .percent(gradebook.getTotal().getPercent())
                .build();
        
        return GradebookResponse.builder()
                .id(gradebook.getId())
                .courseId(gradebook.getCourseId())
                .studentId(gradebook.getStudentId())
                .items(itemResponses)
                .total(totalResponse)
                .updatedAt(gradebook.getUpdatedAt())
                .build();
    }
}


