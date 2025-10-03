package com.courseflow.modules.service;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.courses.repository.CourseRepository;
import com.courseflow.enrollments.service.EnrollmentService;
import com.courseflow.modules.dto.ModuleRequest;
import com.courseflow.modules.dto.ModuleResponse;
import com.courseflow.modules.model.CourseModule;
import com.courseflow.modules.repository.ModuleRepository;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for handling module operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ModuleService {
    
    private final ModuleRepository moduleRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;
    private final AuthService authService;
    
    /**
     * Get module tree for a course. User must be enrolled.
     * 
     * @param courseId Course ID
     * @return Module response with module tree
     */
    public ModuleResponse getModules(String courseId) {
        User currentUser = authService.getCurrentUser();
        
        // Verify enrollment
        enrollmentService.verifyEnrollment(courseId, currentUser.getId());
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }
        
        // Get or create module structure
        CourseModule courseModule = moduleRepository.findByCourseId(courseId)
                .orElseGet(() -> {
                    // Create empty module structure if it doesn't exist
                    CourseModule newModule = CourseModule.builder()
                            .courseId(courseId)
                            .modules(new ArrayList<>())
                            .build();
                    return moduleRepository.save(newModule);
                });
        
        return ModuleResponse.fromEntity(courseModule);
    }
    
    /**
     * Replace entire module tree for a course. Instructor only.
     * 
     * @param courseId Course ID
     * @param request Update modules request
     * @return Updated module response
     */
    public ModuleResponse updateModules(String courseId, ModuleRequest.UpdateModulesRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can update modules", 403);
        }
        
        // Convert DTOs to entities
        List<CourseModule.Module> modules = request.getModules().stream()
                .map(moduleDto -> {
                    List<CourseModule.ModuleItem> items = moduleDto.getItems().stream()
                            .map(itemDto -> CourseModule.ModuleItem.builder()
                                    .itemId(itemDto.getItemId())
                                    .type(itemDto.getType())
                                    .title(itemDto.getTitle())
                                    .url(itemDto.getUrl())
                                    .dueDate(itemDto.getDueDate())
                                    .published(itemDto.getPublished() != null ? itemDto.getPublished() : false)
                                    .build())
                            .collect(Collectors.toList());
                    
                    return CourseModule.Module.builder()
                            .moduleId(moduleDto.getModuleId())
                            .title(moduleDto.getTitle())
                            .position(moduleDto.getPosition())
                            .items(items)
                            .build();
                })
                .collect(Collectors.toList());
        
        // Get or create module structure
        CourseModule courseModule = moduleRepository.findByCourseId(courseId)
                .orElseGet(() -> CourseModule.builder()
                        .courseId(courseId)
                        .modules(new ArrayList<>())
                        .build());
        
        // Update modules
        courseModule.setModules(modules);
        
        courseModule = moduleRepository.save(courseModule);
        log.info("Modules updated for course {} by user {}", courseId, currentUser.getId());
        
        return ModuleResponse.fromEntity(courseModule);
    }
    
    /**
     * Add a new module to a course. Instructor only.
     * 
     * @param courseId Course ID
     * @param request Add module request
     * @return Updated module response
     */
    public ModuleResponse addModule(String courseId, ModuleRequest.AddModuleRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can add modules", 403);
        }
        
        // Get or create module structure
        CourseModule courseModule = moduleRepository.findByCourseId(courseId)
                .orElseGet(() -> {
                    CourseModule newModule = CourseModule.builder()
                            .courseId(courseId)
                            .modules(new ArrayList<>())
                            .build();
                    return moduleRepository.save(newModule);
                });
        
        // Create new module
        CourseModule.Module newModule = CourseModule.Module.builder()
                .moduleId(UUID.randomUUID().toString())
                .title(request.getTitle())
                .position(request.getPosition())
                .items(new ArrayList<>())
                .build();
        
        // Add module to list
        courseModule.getModules().add(newModule);
        
        courseModule = moduleRepository.save(courseModule);
        log.info("Module added to course {} by user {}", courseId, currentUser.getId());
        
        return ModuleResponse.fromEntity(courseModule);
    }
    
    /**
     * Add a new item to a module. Instructor only.
     * 
     * @param courseId Course ID
     * @param moduleId Module ID
     * @param request Add module item request
     * @return Updated module response
     */
    public ModuleResponse addModuleItem(String courseId, String moduleId, ModuleRequest.AddModuleItemRequest request) {
        User currentUser = authService.getCurrentUser();
        
        // Verify course exists
        if (!courseRepository.existsById(courseId)) {
            throw new ApiException("COURSE_NOT_FOUND", "Course not found", 404);
        }
        
        // Check permission: must be instructor/TA of the course or admin
        boolean isInstructor = enrollmentService.checkInstructorRole(courseId, currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.UserRole.ADMIN;
        
        if (!isInstructor && !isAdmin) {
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    "Only instructors and admins can add module items", 403);
        }
        
        // Get module structure
        CourseModule courseModule = moduleRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ApiException("MODULE_STRUCTURE_NOT_FOUND", 
                        "Module structure not found for this course", 404));
        
        // Find the module
        CourseModule.Module module = courseModule.getModules().stream()
                .filter(m -> m.getModuleId().equals(moduleId))
                .findFirst()
                .orElseThrow(() -> new ApiException("MODULE_NOT_FOUND", 
                        "Module not found", 404));
        
        // Create new item
        CourseModule.ModuleItem newItem = CourseModule.ModuleItem.builder()
                .itemId(UUID.randomUUID().toString())
                .type(request.getType())
                .title(request.getTitle())
                .url(request.getUrl())
                .dueDate(request.getDueDate())
                .published(request.getPublished() != null ? request.getPublished() : false)
                .build();
        
        // Add item to module
        module.getItems().add(newItem);
        
        courseModule = moduleRepository.save(courseModule);
        log.info("Module item added to module {} in course {} by user {}", moduleId, courseId, currentUser.getId());
        
        return ModuleResponse.fromEntity(courseModule);
    }
}

