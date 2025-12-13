/**
 * Assignments API functions
 */

import { apiFetch, getApiThrowMessage } from './api';

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
  maxAttempts?: number;
}

export interface Submission {
  id: string;
  courseId: string;
  assignmentId: string;
  studentId: string;
  status: 'DRAFT' | 'SUBMITTED';
  attemptNumber?: number;
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
  maxAttempts?: number;
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
    throw new Error(getApiThrowMessage(response, 'Failed to load assignments. Please try again.'));
  }

  return response.data;
};

/**
 * Get a single assignment by ID
 */
export const getAssignment = async (courseId: string, assignmentId: string): Promise<Assignment> => {
  const response = await apiFetch<Assignment>(`/courses/${courseId}/assignments/${assignmentId}`);

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load assignment. Please try again.'));
  }

  return response.data;
};

/**
 * Get all submissions for an assignment (instructor only)
 */
export const getSubmissions = async (courseId: string, assignmentId: string): Promise<Submission[]> => {
  const response = await apiFetch<Submission[]>(`/courses/${courseId}/assignments/${assignmentId}/submissions`);

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load submissions. Please try again.'));
  }

  return response.data;
};

/**
 * Get student's own submission for an assignment
 */
export const getMySubmission = async (courseId: string, assignmentId: string): Promise<Submission | null> => {
  const response = await apiFetch<Submission>(`/courses/${courseId}/assignments/${assignmentId}/my-submission`);

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
    throw new Error(getApiThrowMessage(response, 'Failed to create assignment. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to update assignment. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to submit assignment. Please try again.'));
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
  const response = await apiFetch<Submission>(`/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to grade submission. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to upload file. Please try again.'));
  }

  return response.data;
};

