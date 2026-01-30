package com.courseflow.courses.service;

import com.courseflow.config.RedisConfig;
import com.courseflow.courses.model.Course;
import com.courseflow.courses.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service that provides cached course lookups. Used by CourseService so that
 * 
 * @Cacheable is applied via proxy (cross-bean call).
 */
@Service
@RequiredArgsConstructor
public class CourseCacheService {

    private final CourseRepository courseRepository;

    @Cacheable(cacheNames = RedisConfig.CACHE_COURSES, key = "#courseId")
    public Optional<Course> findById(String courseId) {
        return courseRepository.findById(courseId);
    }
}
