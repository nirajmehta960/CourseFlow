/**
 * Quizzes API functions (Canvas-like structure)
 */

import { apiFetch, getApiThrowMessage } from './api';

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
    throw new Error(getApiThrowMessage(response, 'Failed to load quizzes. Please try again.'));
  }

  return response.data;
};

/**
 * Get a single quiz by ID
 */
export const getQuiz = async (courseId: string, quizId: string): Promise<Quiz> => {
  const response = await apiFetch<Quiz>(`/courses/${courseId}/quizzes/${quizId}`);

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load quiz. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to create quiz. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to update quiz. Please try again.'));
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
 * Start a quiz attempt
 */
export const startQuizAttempt = async (courseId: string, quizId: string): Promise<QuizAttempt> => {
  const response = await apiFetch<QuizAttempt>(`/courses/${courseId}/quizzes/${quizId}/start`, {
    method: 'POST',
  });

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to start quiz attempt. Please try again.'));
  }

  return response.data;
};

/**
 * Submit a quiz attempt
 */
export const submitQuizAttempt = async (
  courseId: string,
  quizId: string,
  attemptId: string,
  data: QuizAttemptRequest
): Promise<QuizAttempt> => {
  const response = await apiFetch<QuizAttempt>(`/courses/${courseId}/quizzes/${quizId}/attempts/${attemptId}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to submit quiz attempt. Please try again.'));
  }

  return response.data;
};

/**
 * Get student's current attempt
 */
export const getMyAttempt = async (courseId: string, quizId: string): Promise<QuizAttempt | null> => {
  const response = await apiFetch<QuizAttempt>(`/courses/${courseId}/quizzes/${quizId}/my-attempt`);

  if (!response.data) {
    return null;
  }

  return response.data;
};

/**
 * Get all attempts for a quiz (instructor only)
 */
export const getQuizAttempts = async (courseId: string, quizId: string): Promise<QuizAttempt[]> => {
  const response = await apiFetch<QuizAttempt[]>(`/courses/${courseId}/quizzes/${quizId}/attempts`);

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load quiz attempts. Please try again.'));
  }

  return response.data;
};
