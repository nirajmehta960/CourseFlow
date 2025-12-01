/**
 * Courses API functions
 */

import { apiFetch, ApiResponse } from './api';

export interface Course {
  id: string;
  title: string;
  code: string;
  term: string;
  section: string;
  description?: string;
  coverImageUrl?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  createdBy?: string;
  instructorIds: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRequest {
  title: string;
  code: string;
  term: string;
  section: string;
  description?: string;
  coverImageUrl?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  published?: boolean;
}

/**
 * Get all courses for the current user
 */
export const getMyCourses = async (): Promise<Course[]> => {
  const response = await apiFetch<Course[]>('/courses');
  
  if (!response.data) {
    throw new Error('Failed to get courses');
  }

  return response.data;
};

/**
 * Get all published courses (for browsing)
 */
export const getAllPublishedCourses = async (): Promise<Course[]> => {
  const response = await apiFetch<Course[]>('/courses/browse');
  
  if (!response.data) {
    throw new Error('Failed to get all courses');
  }

  return response.data;
};

/**
 * Get a course by ID
 */
export const getCourseById = async (courseId: string): Promise<Course> => {
  const response = await apiFetch<Course>(`/courses/${courseId}`);
  
  if (!response.data) {
    throw new Error('Failed to get course');
  }

  return response.data;
};

/**
 * Create a new course
 */
export const createCourse = async (data: CourseRequest): Promise<Course> => {
  const response = await apiFetch<Course>('/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to create course');
  }

  return response.data;
};

/**
 * Update a course
 */
export const updateCourse = async (
  courseId: string,
  data: CourseRequest
): Promise<Course> => {
  const response = await apiFetch<Course>(`/courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to update course');
  }

  return response.data;
};

export interface CoursePeopleResponse {
  people: {
    enrollmentId: string;
    userId: string;
    name: string;
    email: string;
    courseRole: 'STUDENT' | 'TA' | 'INSTRUCTOR';
    status: 'ACTIVE' | 'INVITED' | 'DROPPED';
  }[];
}

export interface EnrollByEmailRequest {
  email: string;
  role?: 'STUDENT' | 'TA' | 'INSTRUCTOR';
}

export interface UpdateEnrollmentRequest {
  role?: 'STUDENT' | 'TA' | 'INSTRUCTOR';
  status?: 'ACTIVE' | 'INVITED' | 'DROPPED';
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  courseRole: 'STUDENT' | 'TA' | 'INSTRUCTOR';
  status: 'ACTIVE' | 'INVITED' | 'DROPPED';
  createdAt: string;
}

/**
 * Get all people enrolled in a course
 */
export const getCoursePeople = async (courseId: string): Promise<CoursePeopleResponse> => {
  const response = await apiFetch<CoursePeopleResponse>(`/courses/${courseId}/people`);
  
  if (!response.data) {
    throw new Error('Failed to get course people');
  }

  return response.data;
};

/**
 * Self-enroll in a course
 */
export const selfEnrollInCourse = async (courseId: string): Promise<void> => {
  const response = await apiFetch(`/courses/${courseId}/self-enroll`, {
    method: 'POST',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to enroll in course');
  }
};

/**
 * Enroll a user by email
 */
export const enrollByEmail = async (
  courseId: string,
  data: EnrollByEmailRequest
): Promise<Enrollment> => {
  const response = await apiFetch<Enrollment>(`/courses/${courseId}/enroll`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to enroll user');
  }

  return response.data;
};

/**
 * Update an enrollment
 */
export const updateEnrollment = async (
  courseId: string,
  enrollmentId: string,
  data: UpdateEnrollmentRequest
): Promise<Enrollment> => {
  const response = await apiFetch<Enrollment>(`/courses/${courseId}/people/${enrollmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to update enrollment');
  }

  return response.data;
};

/**
 * Delete a course
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  const response = await apiFetch(`/courses/${courseId}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to delete course');
  }
};

