/**
 * Grades API functions
 */

import { apiFetch, ApiResponse } from './api';

export interface GradeItem {
  type: 'ASSIGNMENT' | 'QUIZ';
  itemId: string;
  title: string;
  score: number | null;
  points: number | null;
  status: string | null;
  gradedAt: string | null;
}

export interface GradebookTotal {
  earned: number;
  possible: number;
  percent: number;
}

export interface GradebookResponse {
  id: string;
  courseId: string;
  studentId: string;
  items: GradeItem[];
  total: GradebookTotal;
  updatedAt: string;
}

/**
 * Get gradebook for the current student
 */
export const getMyGradebook = async (courseId: string): Promise<GradebookResponse> => {
  const response = await apiFetch<GradebookResponse>(`/courses/${courseId}/grades/me`);
  
  if (!response.data) {
    throw new Error('Failed to get gradebook');
  }

  return response.data;
};

/**
 * Get all gradebooks for a course (instructor only)
 */
export const getAllGradebooks = async (courseId: string): Promise<GradebookResponse[]> => {
  const response = await apiFetch<GradebookResponse[]>(`/courses/${courseId}/grades`);
  
  if (!response.data) {
    throw new Error('Failed to get gradebooks');
  }

  return response.data;
};

/**
 * Get gradebook for a specific student (instructor only)
 */
export const getStudentGradebook = async (
  courseId: string,
  studentId: string
): Promise<GradebookResponse> => {
  const response = await apiFetch<GradebookResponse>(`/courses/${courseId}/grades/${studentId}`);
  
  if (!response.data) {
    throw new Error('Failed to get student gradebook');
  }

  return response.data;
};


