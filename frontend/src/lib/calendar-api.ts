/**
 * Calendar API functions
 */

import { apiFetch, ApiResponse } from './api';

export interface CalendarEvent {
  id: string;
  courseId: string;
  type: 'ASSIGNMENT_DUE' | 'QUIZ_DUE' | 'CUSTOM';
  title: string;
  startAt: string;
  endAt?: string | null;
  refId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventRequest {
  title: string;
  startAt: string;
  endAt?: string | null;
}

/**
 * Get calendar events for the logged-in user
 */
export const getCalendarEvents = async (
  startAt?: string,
  endAt?: string
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams();
  if (startAt) params.append('startAt', startAt);
  if (endAt) params.append('endAt', endAt);
  
  const queryString = params.toString();
  const url = `/calendar${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiFetch<CalendarEvent[]>(url);
  
  if (!response.data) {
    throw new Error('Failed to get calendar events');
  }

  return response.data;
};

/**
 * Create a custom calendar event
 */
export const createCustomEvent = async (
  courseId: string,
  data: CalendarEventRequest
): Promise<CalendarEvent> => {
  const response = await apiFetch<CalendarEvent>(`/courses/${courseId}/calendar`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to create calendar event');
  }

  return response.data;
};
