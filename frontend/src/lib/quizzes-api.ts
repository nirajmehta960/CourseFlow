/**
 * Quizzes API functions (Canvas-like structure)
 */

import { apiFetch } from './api';

export type QuestionType = 'MCQ' | 'MULTI_SELECT' | 'TRUE_FALSE' | 'SHORT_ANSWER';

export interface Question {
  id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctAnswer?: string; // Hidden for students unless submitted
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  instructions?: string;
  timeLimitMinutes?: number;
  dueAt?: string;
  published: boolean;
  questions: Question[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizRequest {
  title: string;
  instructions?: string;
  timeLimitMinutes?: number;
  dueAt?: string;
  published?: boolean;
  questions: QuestionRequest[];
}

export interface QuestionRequest {
  id?: string; // Optional, for updates
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  position?: number;
}

export interface QuizAttempt {
  id: string;
  courseId: string;
  quizId: string;
  studentId: string;
  answers: Answer[];
  startedAt: string;
  submittedAt?: string;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  score?: number;
  gradedAt?: string;
}

export interface Answer {
  questionId: string;
  answer: string; // Option index(es) for MCQ/MULTI_SELECT, "true"/"false" for TRUE_FALSE, text for SHORT_ANSWER
}

export interface QuizAttemptRequest {
  answers: Answer[];
}

/**
 * Get all quizzes for a course
 */
export const getQuizzes = async (courseId: string): Promise<Quiz[]> => {
  const response = await apiFetch<Quiz[]>(`/courses/${courseId}/quizzes`);
  
  if (!response.data) {
    throw new Error('Failed to get quizzes');
  }

  return response.data;
};

/**
 * Get a single quiz by ID
 */
export const getQuiz = async (courseId: string, quizId: string): Promise<Quiz> => {
  const response = await apiFetch<Quiz>(`/courses/${courseId}/quizzes/${quizId}`);
  
  if (!response.data) {
    throw new Error('Failed to get quiz');
  }

  return response.data;
};

/**
 * Create a new quiz
 */
export const createQuiz = async (courseId: string, data: QuizRequest): Promise<Quiz> => {
  const response = await apiFetch<Quiz>(`/courses/${courseId}/quizzes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to create quiz');
  }

  return response.data;
};

/**
 * Update a quiz
 */
export const updateQuiz = async (
  courseId: string,
  quizId: string,
  data: QuizRequest
): Promise<Quiz> => {
  const response = await apiFetch<Quiz>(`/courses/${courseId}/quizzes/${quizId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to update quiz');
  }

  return response.data;
};

/**
 * Delete a quiz
 */
export const deleteQuiz = async (courseId: string, quizId: string): Promise<void> => {
  await apiFetch(`/courses/${courseId}/quizzes/${quizId}`, {
    method: 'DELETE',
  });
};

/**
 * Start a quiz attempt (without courseId)
 */
export const startQuizAttempt = async (quizId: string): Promise<QuizAttempt> => {
  const response = await apiFetch<QuizAttempt>(`/quizzes/${quizId}/start`, {
    method: 'POST',
  });

  if (!response.data) {
    throw new Error('Failed to start quiz attempt');
  }

  return response.data;
};

/**
 * Submit a quiz attempt (without courseId)
 */
export const submitQuizAttempt = async (
  quizId: string,
  data: QuizAttemptRequest
): Promise<QuizAttempt> => {
  const response = await apiFetch<QuizAttempt>(`/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to submit quiz attempt');
  }

  return response.data;
};

/**
 * Get student's current attempt (without courseId)
 */
export const getMyAttempt = async (quizId: string): Promise<QuizAttempt | null> => {
  const response = await apiFetch<QuizAttempt>(`/quizzes/${quizId}/my-attempt`);

  if (!response.data) {
    return null;
  }

  return response.data;
};

/**
 * Get all attempts for a quiz (instructor only, without courseId)
 */
export const getQuizAttempts = async (quizId: string): Promise<QuizAttempt[]> => {
  const response = await apiFetch<QuizAttempt[]>(`/quizzes/${quizId}/attempts`);

  if (!response.data) {
    throw new Error('Failed to get quiz attempts');
  }

  return response.data;
};
