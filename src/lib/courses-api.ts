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
    userId: string;
    name: string;
    email: string;
    courseRole: 'STUDENT' | 'TA' | 'INSTRUCTOR';
    status: 'ACTIVE' | 'DROPPED';
  }[];
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

