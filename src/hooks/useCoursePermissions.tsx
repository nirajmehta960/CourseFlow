import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getCoursePeople, getCourseById } from '@/lib/courses-api';

/**
 * Hook to check if the current user has instructor/TA permissions in a course
 * Returns whether the user can create/edit course content
 */
export const useCoursePermissions = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [isInstructor, setIsInstructor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!courseId || !user) {
        setIsInstructor(false);
        setLoading(false);
        return;
      }

      // Check if user is global admin
      if (user.role === 'ADMIN') {
        setIsInstructor(true);
        setLoading(false);
        return;
      }

      try {
        // First check enrollment role
        const coursePeople = await getCoursePeople(courseId);
        const currentUserEnrollment = coursePeople.people.find(
          (person) => person.userId === user.id
        );
        
        if (currentUserEnrollment) {
          // User is enrolled - check their role
          const isCourseInstructor = 
            currentUserEnrollment.courseRole === 'INSTRUCTOR' || 
            currentUserEnrollment.courseRole === 'TA';
          setIsInstructor(isCourseInstructor);
          setLoading(false);
          return;
        }

        // If not enrolled, check if user is in instructorIds (course creator)
        // This handles the case where user created the course but enrollment might not exist yet
        const course = await getCourseById(courseId);
        const isCourseCreator = course.instructorIds.includes(user.id);
        
        setIsInstructor(isCourseCreator);
      } catch (error) {
        console.error('Failed to check course permissions:', error);
        setIsInstructor(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [courseId, user]);

  return { isInstructor, loading };
};

