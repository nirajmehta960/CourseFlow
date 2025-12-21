/**
 * Assignments API functions
 */

import { apiFetch } from './api';

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate: string;
  points: number;
  published: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  textAnswer?: string;
  attachments: string[];
  submittedAt: string;
  grade?: {
    score: number;
    feedback?: string;
    gradedBy: string;
    gradedAt: string;
  };
}

export interface AssignmentRequest {
  title: string;
  description?: string;
  dueDate?: string;
  points: number;
  published?: boolean;
}

export interface SubmissionRequest {
  textAnswer?: string;
  attachments?: string[];
}

export interface GradeSubmissionRequest {
  score: number;
  feedback?: string;
}

/**
 * Get all assignments for a course
 */
export const getAssignments = async (courseId: string): Promise<Assignment[]> => {
  const response = await apiFetch<Assignment[]>(`/courses/${courseId}/assignments`);
  
  if (!response.data) {
    throw new Error('Failed to get assignments');
  }

  return response.data;
};

/**
 * Get a single assignment by ID
 */
export const getAssignment = async (courseId: string, assignmentId: string): Promise<Assignment> => {
  const response = await apiFetch<Assignment>(`/courses/${courseId}/assignments/${assignmentId}`);
  
  if (!response.data) {
    throw new Error('Failed to get assignment');
  }

  return response.data;
};

/**
 * Get all submissions for an assignment (instructor only)
 */
export const getSubmissions = async (courseId: string, assignmentId: string): Promise<Submission[]> => {
  const response = await apiFetch<Submission[]>(`/courses/${courseId}/assignments/${assignmentId}/submissions`);
  
  if (!response.data) {
    throw new Error('Failed to get submissions');
  }

  return response.data;
};

/**
 * Create a new assignment
 */
export const createAssignment = async (courseId: string, data: AssignmentRequest): Promise<Assignment> => {
  const response = await apiFetch<Assignment>(`/courses/${courseId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to create assignment');
  }

  return response.data;
};

/**
 * Update an assignment
 */
export const updateAssignment = async (
  courseId: string,
  assignmentId: string,
  data: AssignmentRequest
): Promise<Assignment> => {
  const response = await apiFetch<Assignment>(`/courses/${courseId}/assignments/${assignmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to update assignment');
  }

  return response.data;
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (courseId: string, assignmentId: string): Promise<void> => {
  await apiFetch(`/courses/${courseId}/assignments/${assignmentId}`, {
    method: 'DELETE',
  });
};

/**
 * Submit an assignment
 */
export const submitAssignment = async (
  courseId: string,
  assignmentId: string,
  data: SubmissionRequest
): Promise<Submission> => {
  const response = await apiFetch<Submission>(`/courses/${courseId}/assignments/${assignmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to submit assignment');
  }

  return response.data;
};

/**
 * Grade a submission
 */
export const gradeSubmission = async (
  courseId: string,
  assignmentId: string,
  submissionId: string,
  data: GradeSubmissionRequest
): Promise<Submission> => {
  const response = await apiFetch<Submission>(
    `/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );

  if (!response.data) {
    throw new Error('Failed to grade submission');
  }

  return response.data;
};

