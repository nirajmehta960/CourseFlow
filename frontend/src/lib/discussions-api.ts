/**
 * Discussions API functions
 */

import { apiFetch, ApiResponse } from './api';

export interface Discussion {
  id: string;
  courseId: string;
  title: string;
  bodyHtml: string;
  published: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  postCount?: number;
  posts?: Post[];
}

export interface Post {
  id: string;
  discussionId: string;
  userId: string;
  bodyHtml: string;
  parentPostId?: string | null;
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Post[];
}

export interface DiscussionRequest {
  title: string;
  bodyHtml: string;
  published?: boolean;
}

export interface PostRequest {
  bodyHtml: string;
  parentPostId?: string | null;
}

/**
 * Get all discussions for a course
 */
export const getDiscussions = async (
  courseId: string,
  includeUnpublished: boolean = false
): Promise<Discussion[]> => {
  const response = await apiFetch<Discussion[]>(
    `/courses/${courseId}/discussions?includeUnpublished=${includeUnpublished}`
  );
  
  if (!response.data) {
    throw new Error('Failed to get discussions');
  }

  return response.data;
};

/**
 * Get a discussion by ID with posts
 */
export const getDiscussion = async (
  courseId: string,
  discussionId: string
): Promise<Discussion> => {
  const response = await apiFetch<Discussion>(
    `/courses/${courseId}/discussions/${discussionId}`
  );
  
  if (!response.data) {
    throw new Error('Failed to get discussion');
  }

  return response.data;
};

/**
 * Create a new discussion
 */
export const createDiscussion = async (
  courseId: string,
  data: DiscussionRequest
): Promise<Discussion> => {
  const response = await apiFetch<Discussion>(`/courses/${courseId}/discussions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to create discussion');
  }

  return response.data;
};

/**
 * Update a discussion
 */
export const updateDiscussion = async (
  courseId: string,
  discussionId: string,
  data: DiscussionRequest
): Promise<Discussion> => {
  const response = await apiFetch<Discussion>(
    `/courses/${courseId}/discussions/${discussionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );

  if (!response.data) {
    throw new Error(response.message || 'Failed to update discussion');
  }

  return response.data;
};

/**
 * Delete a discussion
 */
export const deleteDiscussion = async (
  courseId: string,
  discussionId: string
): Promise<void> => {
  const response = await apiFetch(`/courses/${courseId}/discussions/${discussionId}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to delete discussion');
  }
};

/**
 * Create a post/reply
 */
export const createPost = async (
  courseId: string,
  discussionId: string,
  data: PostRequest
): Promise<Post> => {
  const response = await apiFetch<Post>(
    `/courses/${courseId}/discussions/${discussionId}/posts`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  if (!response.data) {
    throw new Error(response.message || 'Failed to create post');
  }

  return response.data;
};

/**
 * Update a post
 */
export const updatePost = async (
  courseId: string,
  postId: string,
  data: PostRequest
): Promise<Post> => {
  const response = await apiFetch<Post>(`/courses/${courseId}/discussions/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error(response.message || 'Failed to update post');
  }

  return response.data;
};

/**
 * Delete a post
 */
export const deletePost = async (courseId: string, postId: string): Promise<void> => {
  const response = await apiFetch(`/courses/${courseId}/discussions/posts/${postId}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to delete post');
  }
};
