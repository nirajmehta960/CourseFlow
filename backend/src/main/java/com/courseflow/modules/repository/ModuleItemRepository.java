package com.courseflow.modules.repository;

import com.courseflow.modules.model.ModuleItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ModuleItem entity operations.
 */
@Repository
public interface ModuleItemRepository extends MongoRepository<ModuleItem, String> {
    
    /**
     * Find all items for a module, ordered by position.
     */
    List<ModuleItem> findByModuleIdOrderByPositionAsc(String moduleId);
    
    /**
     * Find all items for a course.
     */
    List<ModuleItem> findByCourseIdOrderByPositionAsc(String courseId);
    
    /**
     * Find all items for a module.
     */
    List<ModuleItem> findByModuleId(String moduleId);
    
    /**
     * Delete all items for a module.
     */
    void deleteByModuleId(String moduleId);
    
    /**
     * Find item by module ID and position.
     */
    Optional<ModuleItem> findByModuleIdAndPosition(String moduleId, Integer position);
}
