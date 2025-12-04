/**
 * User management API functions
 */

import { apiFetch, ApiResponse, getApiThrowMessage } from './api';
import { UserInfo } from './auth-api';

export interface UpdateUserRolesRequest {
  roles: ('STUDENT' | 'INSTRUCTOR' | 'TA' | 'ADMIN')[];
}

/**
 * Update user roles (admin only)
 */
export const updateUserRoles = async (
  userId: string,
  roles: ('STUDENT' | 'INSTRUCTOR' | 'TA' | 'ADMIN')[]
): Promise<UserInfo> => {
  const response = await apiFetch<UserInfo>(`/users/${userId}/roles`, {
    method: 'PATCH',
    body: JSON.stringify({ roles }),
  });

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to update user roles. Please try again.'));
  }

  return response.data;
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<UserInfo[]> => {
  const response = await apiFetch<UserInfo[]>('/users');

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load users. Please try again.'));
  }

  return response.data;
};
