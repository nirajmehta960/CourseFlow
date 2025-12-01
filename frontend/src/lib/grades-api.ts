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
  feedback?: string | null;
  overrideScore?: number | null;
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

/**
 * Get gradebook view for instructor (table format)
 */
export const getGradebookView = async (courseId: string): Promise<GradebookViewResponse> => {
  const response = await apiFetch<GradebookViewResponse>(`/courses/${courseId}/grades/gradebook`);
  
  if (!response.data) {
    throw new Error('Failed to get gradebook view');
  }

  return response.data;
};

/**
 * Override a grade
 */
export const overrideGrade = async (data: GradeOverrideRequest): Promise<void> => {
  const response = await apiFetch(`/gradebook/override`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to override grade');
  }
};

export interface GradebookViewResponse {
  courseId: string;
  items: GradebookItem[];
  students: StudentGradeRow[];
}

export interface GradebookItem {
  itemId: string;
  title: string;
  type: 'ASSIGNMENT' | 'QUIZ';
  points: number | null;
}

export interface StudentGradeRow {
  studentId: string;
  grades: Record<string, GradeCell>;
  totalEarned: number;
  totalPossible: number;
  percent: number;
}

export interface GradeCell {
  score: number | null;
  points: number | null;
  status: string;
}

export interface GradeOverrideRequest {
  courseId: string;
  studentId: string;
  itemId: string;
  itemType: 'ASSIGNMENT' | 'QUIZ';
  overrideScore?: number | null;
}


