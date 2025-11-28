package com.courseflow.modules.repository;

import com.courseflow.modules.model.Module;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Module entity operations.
 */
@Repository
public interface ModuleRepositoryNew extends MongoRepository<Module, String> {
    
    /**
     * Find all modules for a course, ordered by position.
     */
    List<Module> findByCourseIdOrderByPositionAsc(String courseId);
    
    /**
     * Find all modules for a course.
     */
    List<Module> findByCourseId(String courseId);
    
    /**
     * Delete all modules for a course.
     */
    void deleteByCourseId(String courseId);
    
    /**
     * Find module by course ID and position.
     */
    Optional<Module> findByCourseIdAndPosition(String courseId, Integer position);
}
