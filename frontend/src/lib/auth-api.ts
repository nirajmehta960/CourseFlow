/**
 * Authentication API functions
 */

import { apiFetch, setAccessToken, removeAccessToken, ApiResponse } from './api';

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
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
      throw new Error('Failed to sign up');
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
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }

    if (!response.data) {
      throw new Error('Failed to sign in');
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
    await apiFetch('/auth/logout', {
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
    throw new Error('Failed to get current user');
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
    throw new Error('Failed to refresh token');
  }

  return response.data;
};

