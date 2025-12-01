/**
 * Inbox API functions
 */

import { apiFetch, ApiResponse } from './api';

export interface Conversation {
  id: string;
  courseId?: string;
  participantIds: string[];
  lastMessageAt: string;
  title?: string;
  hasUnread: boolean;
  lastMessagePreview?: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readBy: string[];
  starredBy: string[];
  isRead: boolean;
  isStarred: boolean;
}

export interface CreateConversationRequest {
  courseId?: string;
  participantIds: string[];
  title?: string;
}

export interface SendMessageRequest {
  body: string;
}

/**
 * Get all conversations for the logged-in user
 */
export const getConversations = async (
  filter: 'all' | 'unread' | 'starred' = 'all',
  search?: string,
  courseId?: string
): Promise<Conversation[]> => {
  const params = new URLSearchParams({ filter });
  if (search) params.append('search', search);
  if (courseId) params.append('courseId', courseId);
  
  const response = await apiFetch<Conversation[]>(`/inbox?${params.toString()}`);
  
  if (!response.data) {
    throw new Error('Failed to get conversations');
  }

  return response.data;
};

/**
 * Get a conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<Conversation> => {
  const response = await apiFetch<Conversation>(`/inbox/${conversationId}`);
  
  if (!response.data) {
    throw new Error('Failed to get conversation');
  }

  return response.data;
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  request: CreateConversationRequest
): Promise<Conversation> => {
  const response = await apiFetch<Conversation>(`/inbox`, {
    method: 'POST',
    body: JSON.stringify({
      courseId: request.courseId,
      participantIds: request.participantIds,
      title: request.title,
    }),
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to create conversation');
  }

  return response.data;
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await apiFetch<Message[]>(`/inbox/${conversationId}/messages`);
  
  if (!response.data) {
    throw new Error('Failed to get messages');
  }

  return response.data;
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  request: SendMessageRequest
): Promise<Message> => {
  const response = await apiFetch<Message>(`/inbox/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to send message');
  }

  return response.data;
};

/**
 * Mark a conversation as read
 */
export const markConversationRead = async (conversationId: string): Promise<void> => {
  const response = await apiFetch(`/inbox/${conversationId}/read`, {
    method: 'POST',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to mark conversation as read');
  }
};

/**
 * Toggle star status of a message
 */
export const toggleStar = async (messageId: string): Promise<Message> => {
  const response = await apiFetch<Message>(`/inbox/messages/${messageId}/toggle-star`, {
    method: 'POST',
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to toggle star');
  }

  return response.data;
};
