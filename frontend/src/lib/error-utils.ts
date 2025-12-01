/**
 * Error utilities for standardized error handling
 */

export interface StandardError {
  timestamp: string;
  path: string;
  code: string;
  message: string;
  details?: string[];
}

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Parse error response from backend
 */
export const parseError = (error: any): StandardError | null => {
  // Check if it's already in the standardized format
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

  // Fallback: try to extract from ApiResponse format
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
 * Extract field errors from validation details
 */
export const extractFieldErrors = (error: StandardError): Map<string, string> => {
  const fieldErrors = new Map<string, string>();

  if (error.details && error.details.length > 0) {
    error.details.forEach((detail) => {
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
 * Get user-friendly error message
 */
export const getErrorMessage = (error: any): string => {
  const parsed = parseError(error);
  if (parsed) {
    return parsed.message;
  }
  return "An unexpected error occurred. Please try again.";
};

/**
 * Get error code
 */
export const getErrorCode = (error: any): string => {
  const parsed = parseError(error);
  return parsed?.code || "UNKNOWN_ERROR";
};
