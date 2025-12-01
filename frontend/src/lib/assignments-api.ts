/**
 * Assignments API functions
 */

import { apiFetch } from './api';

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string; // HTML
  dueAt: string;
  availableFrom?: string;
  availableUntil?: string;
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
  status: 'DRAFT' | 'SUBMITTED';
  bodyText?: string;
  fileUrls: string[];
  submittedAt?: string;
  grade?: {
    pointsAwarded: number;
    feedback?: string;
    gradedBy: string;
    gradedAt: string;
  };
}

export interface AssignmentRequest {
  title: string;
  description?: string; // HTML
  dueAt?: string;
  availableFrom?: string;
  availableUntil?: string;
  points: number;
  published?: boolean;
}

export interface SubmissionRequest {
  status?: 'DRAFT' | 'SUBMITTED';
  bodyText?: string;
  fileUrls?: string[];
}

export interface GradeSubmissionRequest {
  pointsAwarded?: number;
  feedback?: string;
}

export interface FileUploadRequest {
  fileName: string;
  base64Data: string; // data:image/png;base64,...
}

export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
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
 * Get a single assignment by ID (without courseId)
 */
export const getAssignment = async (assignmentId: string): Promise<Assignment> => {
  const response = await apiFetch<Assignment>(`/assignments/${assignmentId}`);
  
  if (!response.data) {
    throw new Error('Failed to get assignment');
  }

  return response.data;
};

/**
 * Get all submissions for an assignment (instructor only)
 */
export const getSubmissions = async (assignmentId: string): Promise<Submission[]> => {
  const response = await apiFetch<Submission[]>(`/assignments/${assignmentId}/submissions`);
  
  if (!response.data) {
    throw new Error('Failed to get submissions');
  }

  return response.data;
};

/**
 * Get student's own submission for an assignment
 */
export const getMySubmission = async (assignmentId: string): Promise<Submission | null> => {
  const response = await apiFetch<Submission>(`/assignments/${assignmentId}/my-submission`);
  
  if (!response.data) {
    return null;
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
 * Update an assignment (without courseId)
 */
export const updateAssignment = async (
  assignmentId: string,
  data: AssignmentRequest
): Promise<Assignment> => {
  const response = await apiFetch<Assignment>(`/assignments/${assignmentId}`, {
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
 * Submit an assignment (without courseId)
 */
export const submitAssignment = async (
  assignmentId: string,
  data: SubmissionRequest
): Promise<Submission> => {
  const response = await apiFetch<Submission>(`/assignments/${assignmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to submit assignment');
  }

  return response.data;
};

/**
 * Grade a submission (without courseId/assignmentId)
 */
export const gradeSubmission = async (
  submissionId: string,
  data: GradeSubmissionRequest
): Promise<Submission> => {
  const response = await apiFetch<Submission>(`/submissions/${submissionId}/grade`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to grade submission');
  }

  return response.data;
};

/**
 * Upload a file (base64 for now)
 */
export const uploadFile = async (data: FileUploadRequest): Promise<FileUploadResponse> => {
  const response = await apiFetch<FileUploadResponse>(`/files/upload`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to upload file');
  }

  return response.data;
};

