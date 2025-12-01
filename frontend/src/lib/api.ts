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

export interface StandardError {
  timestamp: string;
  path: string;
  code: string;
  message: string;
  details?: string[];
}

/**
 * Parse standardized error response from backend
 */
export const parseError = (error: any): StandardError | null => {
  // Check if it's already in the standardized format (direct error response)
  if (error?.timestamp && error?.path && error?.code && error?.message) {
    return error as StandardError;
  }

  // Check if it's wrapped in response.data
  if (error?.response?.data) {
    const data = error.response.data;
    if (data.timestamp && data.path && data.code && data.message) {
      return data as StandardError;
    }
  }

  // Fallback: try to extract from old ApiResponse format
  if (error?.response?.data?.error) {
    const errorData = error.response.data.error;
    return {
      timestamp: new Date().toISOString(),
      path: error.response.config?.url || "/unknown",
      code: errorData.code || "UNKNOWN_ERROR",
      message: errorData.message || "An error occurred",
      details: errorData.details,
    };
  }

  // Network error
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      timestamp: new Date().toISOString(),
      path: "/unknown",
      code: "NETWORK_ERROR",
      message: "Network error. Please check your connection.",
      details: [],
    };
  }

  // Generic error
  if (error?.message) {
    return {
      timestamp: new Date().toISOString(),
      path: error?.response?.config?.url || "/unknown",
      code: "UNKNOWN_ERROR",
      message: error.message,
      details: [],
    };
  }

  return null;
};

/**
 * Extract error message from API error response
 */
export const getErrorMessage = (error: any): string => {
  const parsed = parseError(error);
  if (parsed) {
    return parsed.message;
  }
  
  // Fallback to old format
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Extract field errors from validation details
 */
export const extractFieldErrors = (error: any): Map<string, string> => {
  const fieldErrors = new Map<string, string>();
  const parsed = parseError(error);

  if (parsed?.details && parsed.details.length > 0) {
    parsed.details.forEach((detail) => {
      // Format: "fieldName: error message"
      const match = detail.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const [, field, message] = match;
        fieldErrors.set(field.trim(), message.trim());
      }
    });
  }

  return fieldErrors;
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
      // Check if response is in standardized error format
      if (data.timestamp && data.path && data.code && data.message) {
        // Standardized error format
        const apiError: any = new Error(data.message);
        apiError.response = {
          data: data, // Already in StandardError format
          status: response.status,
          config: { url: endpoint },
        };
        throw apiError;
      }
      
      // Fallback: old ApiResponse format
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
        config: { url: endpoint },
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

