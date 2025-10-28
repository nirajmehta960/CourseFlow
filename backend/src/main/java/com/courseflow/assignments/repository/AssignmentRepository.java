package com.courseflow.assignments.repository;

import com.courseflow.assignments.model.Assignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Assignment entity operations.
 */
@Repository
public interface AssignmentRepository extends MongoRepository<Assignment, String> {
    
    /**
     * Find all assignments for a course, ordered by due date.
     * 
     * @param courseId The course ID
     * @return List of assignments for the course
     */
    List<Assignment> findByCourseIdOrderByDueDateAsc(String courseId);
    
    /**
     * Find all published assignments for a course.
     * 
     * @param courseId The course ID
     * @param published Published status
     * @return List of assignments
     */
    List<Assignment> findByCourseIdAndPublishedOrderByDueDateAsc(String courseId, Boolean published);
    
    /**
     * Check if an assignment exists in a course.
     * 
     * @param courseId The course ID
     * @param assignmentId The assignment ID
     * @return true if assignment exists in the course, false otherwise
     */
    boolean existsByIdAndCourseId(String assignmentId, String courseId);
}


