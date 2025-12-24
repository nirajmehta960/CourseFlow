package com.courseflow.grades.repository;

import com.courseflow.grades.model.Gradebook;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Gradebook entity operations.
 */
@Repository
public interface GradebookRepository extends MongoRepository<Gradebook, String> {
    
    /**
     * Find gradebook for a specific course and student.
     * 
     * @param courseId The course ID
     * @param studentId The student ID
     * @return Optional gradebook if found
     */
    Optional<Gradebook> findByCourseIdAndStudentId(String courseId, String studentId);
    
    /**
     * Find all gradebooks for a specific course.
     * 
     * @param courseId The course ID
     * @return List of gradebooks for the course
     */
    List<Gradebook> findByCourseId(String courseId);
    
    /**
     * Find all gradebooks for a specific student.
     * 
     * @param studentId The student ID
     * @return List of gradebooks for the student
     */
    List<Gradebook> findByStudentId(String studentId);
    
    /**
     * Check if a gradebook exists for a course and student.
     * 
     * @param courseId The course ID
     * @param studentId The student ID
     * @return true if gradebook exists, false otherwise
     */
    boolean existsByCourseIdAndStudentId(String courseId, String studentId);
}


