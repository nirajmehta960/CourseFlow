/**
 * Authentication API functions
 */

import { apiFetch, setAccessToken, removeAccessToken, ApiResponse, getApiThrowMessage } from './api';

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'TA' | 'ADMIN';
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  roles: ('STUDENT' | 'INSTRUCTOR' | 'TA' | 'ADMIN')[];
  bio?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  major?: string;
  year?: string;
  enrollmentDate?: string;
  studentId?: string;
  timezone?: string;
  links?: { name: string; url: string }[];
}

export interface AuthResponse {
  accessToken: string;
  user: UserInfo;
}

/**
 * Sign up a new user
 */
export const signUp = async (data: SignUpRequest): Promise<AuthResponse> => {
  try {
    const response = await apiFetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }

    if (!response.data) {
      throw new Error(getApiThrowMessage(response, 'Failed to sign up. Please try again.'));
    }

    return response.data;
  } catch (error: any) {
    // Re-throw with better error message
    throw error;
  }
};

/**
 * Sign in a user
 */
export const signIn = async (data: SignInRequest): Promise<AuthResponse> => {
  try {
    const response = await apiFetch<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }

    if (!response.data) {
      throw new Error(getApiThrowMessage(response, 'Failed to sign in. Please try again.'));
    }

    return response.data;
  } catch (error: any) {
    // Re-throw with better error message
    throw error;
  }
};

/**
 * Sign out a user
 */
export const signOut = async (): Promise<void> => {
  try {
    await apiFetch('/auth/signout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error signing out:', error);
  } finally {
    removeAccessToken();
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  const response = await apiFetch<UserInfo>('/auth/me');

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to load user. Please try again.'));
  }

  return response.data;
};

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<AuthResponse> => {
  const response = await apiFetch<AuthResponse>('/auth/refresh', {
    method: 'POST',
  });

  if (response.data?.accessToken) {
    setAccessToken(response.data.accessToken);
  }

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to refresh session. Please try again.'));
  }

  return response.data;
};


/**
 * Update user profile
 */
export const updateProfile = async (userId: string, data: Partial<UserInfo>): Promise<UserInfo> => {
  const response = await apiFetch<UserInfo>(`/users/${userId}/profile`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error(getApiThrowMessage(response, 'Failed to update user. Please try again.'));
  }

  return response.data;
};
