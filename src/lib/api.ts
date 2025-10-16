/**
 * API configuration and base utilities
 */

// Backend runs on port 4000 with context-path /api
// Frontend runs on port 5173 (default Vite port)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
}

/**
 * Get the stored access token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Store the access token
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

/**
 * Remove the access token
 */
export const removeAccessToken = (): void => {
  localStorage.removeItem('accessToken');
};

export interface ApiError {
  code: string;
  message: string;
  details?: string[];
}

/**
 * Extract error message from API error response (following momento-app patterns)
 */
export const getErrorMessage = (error: any): string => {
  // Handle our Spring Boot ApiResponse format
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  // Handle standard error response
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Handle direct message
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Base fetch function with authentication headers and better error handling
 */
export const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for refresh token
    });

    // Check content type to determine if response is JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data: ApiResponse<T>;
    
    if (isJson) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, create a generic error
        const error: ApiError = {
          code: 'PARSE_ERROR',
          message: 'Failed to parse server response',
        };
        const apiError: any = new Error(error.message);
        apiError.response = {
          data: { error, success: false },
          status: response.status,
        };
        throw apiError;
      }
    } else {
      // Non-JSON response (like HTML error page for 404)
      const error: ApiError = {
        code: response.status === 404 ? 'NOT_FOUND' : 'UNKNOWN_ERROR',
        message: response.status === 404 
          ? `Endpoint not found: ${endpoint}. Please check if the backend is running.`
          : `Server returned ${response.status} ${response.statusText}`,
      };
      const apiError: any = new Error(error.message);
      apiError.response = {
        data: { error, success: false },
        status: response.status,
      };
      throw apiError;
    }

    if (!response.ok) {
      // Create an error object that matches our ApiError format
      const error: ApiError = {
        code: data.error?.code || 'UNKNOWN_ERROR',
        message: data.error?.message || 'An error occurred',
        details: data.error?.details,
      };
      
      // Throw error with response data attached for better error handling
      const apiError: any = new Error(error.message);
      apiError.response = {
        data: {
          error: error,
          success: false,
        },
        status: response.status,
      };
      throw apiError;
    }

    return data;
  } catch (error: any) {
    // Re-throw if it's already our formatted error
    if (error.response) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError: any = new Error('Network error. Please check your connection.');
      networkError.response = {
        data: {
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error. Please check your connection.',
          },
          success: false,
        },
        status: 0,
      };
      throw networkError;
    }
    
    throw error;
  }
};

