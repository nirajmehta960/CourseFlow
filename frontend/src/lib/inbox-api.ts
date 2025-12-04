/**
 * Inbox API functions
 */

import { apiFetch, ApiResponse, getApiThrowMessage } from './api';

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
    throw new Error(getApiThrowMessage(response, 'Failed to load conversations. Please try again.'));
  }

  return response.data;
};

/**
 * Get a conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<Conversation> => {
  const response = await apiFetch<Conversation>(`/inbox/${conversationId}`);
  
  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load conversation. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to create conversation. Please try again.'));
  }

  return response.data;
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const response = await apiFetch<Message[]>(`/inbox/${conversationId}/messages`);
  
  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load messages. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to send message. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to mark conversation as read. Please try again.'));
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
    throw new Error(getApiThrowMessage(response, 'Failed to update star. Please try again.'));
  }

  return response.data;
};
