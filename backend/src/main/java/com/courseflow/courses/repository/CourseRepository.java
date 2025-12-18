package com.courseflow.courses.repository;

import com.courseflow.courses.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Course entity operations.
 */
@Repository
public interface CourseRepository extends MongoRepository<Course, String> {
    
    /**
     * Find all courses where the user is listed as an instructor.
     * 
     * @param instructorId The instructor user ID
     * @return List of courses where user is an instructor
     */
    List<Course> findByInstructorIdsContaining(String instructorId);
    
    /**
     * Check if a course exists with the given code, term, and section.
     * 
     * @param code Course code
     * @param term Term
     * @param section Section
     * @return true if course exists, false otherwise
     */
    boolean existsByCodeAndTermAndSection(String code, String term, String section);
}

