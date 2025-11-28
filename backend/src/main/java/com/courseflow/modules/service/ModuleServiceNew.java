package com.courseflow.modules.service;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.courses.repository.CourseRepository;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.modules.dto.ModuleRequestNew;
import com.courseflow.modules.dto.ModuleResponseNew;
import com.courseflow.modules.model.Module;
import com.courseflow.modules.model.ModuleItem;
import com.courseflow.modules.repository.ModuleItemRepository;
import com.courseflow.modules.repository.ModuleRepositoryNew;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for handling module operations (Canvas-like structure).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ModuleServiceNew {
    
    private final ModuleRepositoryNew moduleRepository;
    private final ModuleItemRepository moduleItemRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;
    private final AuthService authService;
    
    /**
     * Get all modules for a course with their items.
     * User must be enrolled.
     */
    public ModuleResponseNew.ModulesResponse getModules(String courseId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }
        
        // Get all modules for the course, ordered by position
        List<Module> modules = moduleRepository.findByCourseIdOrderByPositionAsc(courseId);
        
        // Get all items for all modules
        List<ModuleItem> allItems = moduleItemRepository.findByCourseIdOrderByPositionAsc(courseId);
        
        // Group items by module ID
        Map<String, List<ModuleItem>> itemsByModule = allItems.stream()
                .collect(Collectors.groupingBy(ModuleItem::getModuleId));
        
        // Map to response DTOs
        List<ModuleResponseNew.ModuleDto> moduleDtos = modules.stream()
                .map(module -> ModuleResponseNew.fromEntity(
                        module,
                        itemsByModule.getOrDefault(module.getId(), new ArrayList<>())
                ))
                .collect(Collectors.toList());
        
        return ModuleResponseNew.ModulesResponse.builder()
                .modules(moduleDtos)
                .build();
    }
    
    /**
     * Create a new module. Instructor only.
     */
    public ModuleResponseNew.ModuleDto createModule(String courseId, ModuleRequestNew.CreateModuleRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can create modules", 403);
        }
        
        // Determine position - if not provided, add at the end
        Integer position = request.getPosition();
        if (position == null) {
            List<Module> existingModules = moduleRepository.findByCourseIdOrderByPositionAsc(courseId);
            position = existingModules.isEmpty() ? 0 : existingModules.get(existingModules.size() - 1).getPosition() + 1;
        }
        
        // Create module
        Module module = Module.builder()
                .id(UUID.randomUUID().toString())
                .courseId(courseId)
                .title(request.getTitle())
                .position(position)
                .published(request.getPublished() != null ? request.getPublished() : false)
                .unlockAt(request.getUnlockAt())
                .build();
        
        module = moduleRepository.save(module);
        log.info("Module created: {} in course {} by user {}", module.getId(), courseId, currentUser.getId());
        
        return ModuleResponseNew.fromEntity(module, new ArrayList<>());
    }
    
    /**
     * Update a module. Instructor only.
     */
    public ModuleResponseNew.ModuleDto updateModule(String moduleId, ModuleRequestNew.UpdateModuleRequest request) {
        User currentUser = authService.getCurrentUser();
        
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ApiException("MODULE_NOT_FOUND", "Module not found", 404));
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(module.getCourseId(), currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can update modules", 403);
        }
        
        // Update fields if provided
        if (request.getTitle() != null) {
            module.setTitle(request.getTitle());
        }
        if (request.getPosition() != null) {
            module.setPosition(request.getPosition());
        }
        if (request.getPublished() != null) {
            module.setPublished(request.getPublished());
        }
        if (request.getUnlockAt() != null) {
            module.setUnlockAt(request.getUnlockAt());
        }
        
        module = moduleRepository.save(module);
        log.info("Module updated: {} by user {}", moduleId, currentUser.getId());
        
        // Get items for this module
        List<ModuleItem> items = moduleItemRepository.findByModuleIdOrderByPositionAsc(moduleId);
        
        return ModuleResponseNew.fromEntity(module, items);
    }
    
    /**
     * Delete a module. Instructor only.
     */
    @Transactional
    public void deleteModule(String moduleId) {
        User currentUser = authService.getCurrentUser();
        
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ApiException("MODULE_NOT_FOUND", "Module not found", 404));
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(module.getCourseId(), currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can delete modules", 403);
        }
        
        // Delete all items in the module
        moduleItemRepository.deleteByModuleId(moduleId);
        
        // Delete the module
        moduleRepository.delete(module);
        log.info("Module deleted: {} by user {}", moduleId, currentUser.getId());
    }
    
    /**
     * Create a new module item. Instructor only.
     */
    public ModuleResponseNew.ModuleItemDto createModuleItem(String moduleId, ModuleRequestNew.CreateModuleItemRequest request) {
        User currentUser = authService.getCurrentUser();
        
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ApiException("MODULE_NOT_FOUND", "Module not found", 404));
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(module.getCourseId(), currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can create module items", 403);
        }
        
        // Determine position - if not provided, add at the end
        Integer position = request.getPosition();
        if (position == null) {
            List<ModuleItem> existingItems = moduleItemRepository.findByModuleIdOrderByPositionAsc(moduleId);
            position = existingItems.isEmpty() ? 0 : existingItems.get(existingItems.size() - 1).getPosition() + 1;
        }
        
        // Create module item
        ModuleItem item = ModuleItem.builder()
                .id(UUID.randomUUID().toString())
                .moduleId(moduleId)
                .courseId(module.getCourseId())
                .type(request.getType())
                .title(request.getTitle())
                .contentRefId(request.getContentRefId())
                .url(request.getUrl())
                .position(position)
                .published(request.getPublished() != null ? request.getPublished() : false)
                .build();
        
        item = moduleItemRepository.save(item);
        log.info("Module item created: {} in module {} by user {}", item.getId(), moduleId, currentUser.getId());
        
        return ModuleResponseNew.fromEntity(item);
    }
    
    /**
     * Update a module item. Instructor only.
     */
    public ModuleResponseNew.ModuleItemDto updateModuleItem(String itemId, ModuleRequestNew.UpdateModuleItemRequest request) {
        User currentUser = authService.getCurrentUser();
        
        ModuleItem item = moduleItemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("MODULE_ITEM_NOT_FOUND", "Module item not found", 404));
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(item.getCourseId(), currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can update module items", 403);
        }
        
        // Update fields if provided
        if (request.getTitle() != null) {
            item.setTitle(request.getTitle());
        }
        if (request.getPosition() != null) {
            item.setPosition(request.getPosition());
        }
        if (request.getPublished() != null) {
            item.setPublished(request.getPublished());
        }
        if (request.getContentRefId() != null) {
            item.setContentRefId(request.getContentRefId());
        }
        if (request.getUrl() != null) {
            item.setUrl(request.getUrl());
        }
        
        item = moduleItemRepository.save(item);
        log.info("Module item updated: {} by user {}", itemId, currentUser.getId());
        
        return ModuleResponseNew.fromEntity(item);
    }
    
    /**
     * Delete a module item. Instructor only.
     */
    public void deleteModuleItem(String itemId) {
        User currentUser = authService.getCurrentUser();
        
        ModuleItem item = moduleItemRepository.findById(itemId)
                .orElseThrow(() -> new ApiException("MODULE_ITEM_NOT_FOUND", "Module item not found", 404));
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(item.getCourseId(), currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can delete module items", 403);
        }
        
        moduleItemRepository.delete(item);
        log.info("Module item deleted: {} by user {}", itemId, currentUser.getId());
    }
    
    /**
     * Reorder modules and items. Instructor only.
     */
    public ModuleResponseNew.ModulesResponse reorderModules(String courseId, ModuleRequestNew.ReorderRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.hasRole(User.UserRole.ADMIN);
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can reorder modules", 403);
        }
        
        // Reorder modules
        if (request.getModuleOrder() != null && !request.getModuleOrder().isEmpty()) {
            List<Module> modules = moduleRepository.findByCourseId(courseId);
            Map<String, Module> moduleMap = modules.stream()
                    .collect(Collectors.toMap(Module::getId, m -> m));
            
            for (int i = 0; i < request.getModuleOrder().size(); i++) {
                String moduleId = request.getModuleOrder().get(i);
                Module module = moduleMap.get(moduleId);
                if (module != null) {
                    module.setPosition(i);
                    moduleRepository.save(module);
                }
            }
        }
        
        // Reorder items within modules
        if (request.getItemOrders() != null && !request.getItemOrders().isEmpty()) {
            for (Map.Entry<String, List<String>> entry : request.getItemOrders().entrySet()) {
                String moduleId = entry.getKey();
                List<String> itemOrder = entry.getValue();
                
                List<ModuleItem> items = moduleItemRepository.findByModuleId(moduleId);
                Map<String, ModuleItem> itemMap = items.stream()
                        .collect(Collectors.toMap(ModuleItem::getId, i -> i));
                
                for (int i = 0; i < itemOrder.size(); i++) {
                    String itemId = itemOrder.get(i);
                    ModuleItem item = itemMap.get(itemId);
                    if (item != null) {
                        item.setPosition(i);
                        moduleItemRepository.save(item);
                    }
                }
            }
        }
        
        // Return updated modules
        return getModules(courseId);
    }
}
