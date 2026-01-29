/**
 * Courses API functions
 */

import { apiFetch, ApiResponse, getApiThrowMessage } from './api';

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
    throw new Error(getApiThrowMessage(response, 'Failed to load courses. Please try again.'));
  }

  return response.data;
};

/**
 * Get all published courses (for browsing)
 */
export const getAllPublishedCourses = async (): Promise<Course[]> => {
  const response = await apiFetch<Course[]>('/courses/browse');

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load courses. Please try again.'));
  }

  return response.data;
};

/**
 * Get a course by ID
 */
export const getCourseById = async (courseId: string): Promise<Course> => {
  const response = await apiFetch<Course>(`/courses/${courseId}`);

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load course. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to create course. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to update course. Please try again.'));
  }

  return response.data;
};

export interface CoursePeopleResponse {
  people: {
    enrollmentId: string;
    userId: string;
    name: string;
    email: string;
    profileImageUrl?: string;
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
    throw new Error(getApiThrowMessage(response, 'Failed to load course people. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to enroll in course. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to enroll user. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to update enrollment. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to delete course. Please try again.'));
  }
};
export interface CourseStats {
  totalStudents: number;
  submissionsPending: number;
}

/**
 * Get course statistics (instructor only)
 */
export const getCourseStats = async (courseId: string): Promise<CourseStats> => {
  const response = await apiFetch<CourseStats>(`/courses/${courseId}/stats`);

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load course stats. Please try again.'));
  }

  return response.data;
};
