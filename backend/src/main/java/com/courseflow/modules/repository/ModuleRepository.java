package com.courseflow.modules.repository;

import com.courseflow.modules.model.CourseModule;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for CourseModule entity operations.
 */
@Repository
public interface ModuleRepository extends MongoRepository<CourseModule, String> {
    
    /**
     * Find module structure by course ID.
     * 
     * @param courseId The course ID
     * @return Optional CourseModule
     */
    Optional<CourseModule> findByCourseId(String courseId);
    
    /**
     * Check if module structure exists for a course.
     * 
     * @param courseId The course ID
     * @return true if exists, false otherwise
     */
    boolean existsByCourseId(String courseId);
    
    /**
     * Delete module structure by course ID.
     * 
     * @param courseId The course ID
     */
    void deleteByCourseId(String courseId);
}


