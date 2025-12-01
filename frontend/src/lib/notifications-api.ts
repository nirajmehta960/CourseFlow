/**
 * Notifications API functions
 */

import { apiFetch, ApiResponse } from './api';

export interface Notification {
  id: string;
  userId: string;
  type: 'NEW_ASSIGNMENT' | 'NEW_QUIZ' | 'GRADE_POSTED' | 'DISCUSSION_REPLY' | 'INBOX_MESSAGE';
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Get all notifications for the logged-in user
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const response = await apiFetch<Notification[]>(`/notifications`);
  
  if (!response.data) {
    throw new Error('Failed to get notifications');
  }

  return response.data;
};

/**
 * Get unread notifications
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const response = await apiFetch<Notification[]>(`/notifications/unread`);
  
  if (!response.data) {
    throw new Error('Failed to get unread notifications');
  }

  return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiFetch<number>(`/notifications/unread/count`);
  
  if (!response.data) {
    throw new Error('Failed to get unread count');
  }

  return response.data;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  const response = await apiFetch(`/notifications/${notificationId}/read`, {
    method: 'POST',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to mark notification as read');
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  const response = await apiFetch(`/notifications/read-all`, {
    method: 'POST',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to mark all notifications as read');
  }
};
