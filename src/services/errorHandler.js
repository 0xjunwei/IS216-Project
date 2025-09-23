/**
 * Error handling service for user-friendly error management
 * Provides centralized error handling, logging, and user notifications
 */

export const errorHandler = {
  // Error types
  ERROR_TYPES: {
    VALIDATION: "validation",
    NETWORK: "network",
    AUTHENTICATION: "authentication",
    PERMISSION: "permission",
    SERVER: "server",
    UNKNOWN: "unknown",
  },

  // Error severity levels
  SEVERITY: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
  },

  /**
   * Shows error message to user
   * @param {string} message - Error message to display
   * @param {string} type - Error type (default: 'error')
   * @param {string} severity - Error severity (default: 'medium')
   * @param {number} duration - Display duration in ms (default: 5000)
   */
  showError: (
    message,
    type = "error",
    severity = "medium",
    duration = 5000,
  ) => {
    console.error(`[${type.toUpperCase()}] ${message}`);

    // Create error notification element
    const errorElement = document.createElement("div");
    errorElement.className = `alert alert-${type === "error" ? "danger" : "warning"} alert-dismissible fade show position-fixed`;
    errorElement.style.cssText = `
      top: 20px; 
      right: 20px; 
      z-index: 9999; 
      min-width: 300px; 
      max-width: 500px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
    `;

    // Add severity indicator
    const severityIcon = errorHandler._getSeverityIcon(severity);
    const typeIcon = errorHandler._getTypeIcon(type);

    errorElement.innerHTML = `
      <div class="d-flex align-items-start">
        <div class="me-2">
          ${typeIcon}
        </div>
        <div class="flex-grow-1">
          <div class="d-flex align-items-center mb-1">
            <strong class="me-2">${errorHandler._getTypeLabel(type)}</strong>
            ${severityIcon}
          </div>
          <div class="small">${message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(errorElement);

    // Auto-remove after duration
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.classList.remove("show");
        setTimeout(() => {
          if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
          }
        }, 150); // Match Bootstrap fade duration
      }
    }, duration);
  },

  /**
   * Shows success message to user
   * @param {string} message - Success message to display
   * @param {number} duration - Display duration in ms (default: 3000)
   */
  showSuccess: (message, duration = 3000) => {
    console.log(`[SUCCESS] ${message}`);

    const successElement = document.createElement("div");
    successElement.className =
      "alert alert-success alert-dismissible fade show position-fixed";
    successElement.style.cssText = `
      top: 20px; 
      right: 20px; 
      z-index: 9999; 
      min-width: 300px; 
      max-width: 500px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
    `;

    successElement.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="fas fa-check-circle me-2 text-success"></i>
        <div class="flex-grow-1">${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    document.body.appendChild(successElement);

    setTimeout(() => {
      if (successElement.parentNode) {
        successElement.classList.remove("show");
        setTimeout(() => {
          if (successElement.parentNode) {
            successElement.parentNode.removeChild(successElement);
          }
        }, 150);
      }
    }, duration);
  },

  /**
   * Handles API errors with specific error messages
   * @param {Error} error - Error object from API call
   * @returns {string} - User-friendly error message
   */
  handleApiError: (error) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return (
            data?.message ||
            "Invalid request. Please check your input and try again."
          );
        case 401:
          return "Authentication failed. Please login again.";
        case 403:
          return "Access denied. You do not have permission to perform this action.";
        case 404:
          return "The requested resource was not found.";
        case 409:
          return "Conflict. The resource already exists or is in use.";
        case 422:
          return data?.message || "Validation failed. Please check your input.";
        case 429:
          return "Too many requests. Please wait a moment and try again.";
        case 500:
          return "Server error. Please try again later.";
        case 502:
          return "Service temporarily unavailable. Please try again later.";
        case 503:
          return "Service unavailable. Please try again later.";
        default:
          return data?.message || `Server error (${status}). Please try again.`;
      }
    } else if (error.request) {
      // Network error
      return "Network error. Please check your internet connection and try again.";
    } else {
      // Other error
      return error.message || "An unexpected error occurred. Please try again.";
    }
  },

  /**
   * Handles validation errors
   * @param {Object} errors - Validation errors object
   */
  handleValidationError: (errors) => {
    const errorMessages = Object.values(errors).filter(Boolean);
    if (errorMessages.length > 0) {
      errorHandler.showError(errorMessages.join(", "), "validation", "medium");
    }
  },

  /**
   * Handles authentication errors
   * @param {Error} error - Authentication error
   */
  handleAuthError: (error) => {
    const message = errorHandler.handleApiError(error);
    errorHandler.showError(message, "authentication", "high");
  },

  /**
   * Handles network errors
   * @param {Error} error - Network error
   */
  handleNetworkError: (error) => {
    const message = errorHandler.handleApiError(error);
    errorHandler.showError(message, "network", "high");
  },

  /**
   * Logs error for debugging
   * @param {Error} error - Error to log
   * @param {string} context - Context where error occurred
   * @param {Object} additionalData - Additional data to log
   */
  logError: (error, context = "Unknown", additionalData = {}) => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...additionalData,
    };

    console.error("Error logged:", errorInfo);

    // In production, you might want to send this to an error tracking service
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, errorInfo)
    }
  },

  /**
   * Wraps async function with error handling
   * @param {Function} asyncFn - Async function to wrap
   * @param {string} context - Context for error logging
   * @returns {Function} - Wrapped function with error handling
   */
  wrapAsync: (asyncFn, context = "Unknown") => {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        errorHandler.logError(error, context);
        errorHandler.showError(errorHandler.handleApiError(error));
        throw error;
      }
    };
  },

  // Private helper methods
  _getSeverityIcon: (severity) => {
    const icons = {
      low: '<i class="fas fa-info-circle text-info"></i>',
      medium: '<i class="fas fa-exclamation-triangle text-warning"></i>',
      high: '<i class="fas fa-exclamation-circle text-danger"></i>',
      critical: '<i class="fas fa-times-circle text-danger"></i>',
    };
    return icons[severity] || icons.medium;
  },

  _getTypeIcon: (type) => {
    const icons = {
      error: '<i class="fas fa-times-circle text-danger"></i>',
      warning: '<i class="fas fa-exclamation-triangle text-warning"></i>',
      info: '<i class="fas fa-info-circle text-info"></i>',
      success: '<i class="fas fa-check-circle text-success"></i>',
      validation: '<i class="fas fa-exclamation-triangle text-warning"></i>',
      network: '<i class="fas fa-wifi text-danger"></i>',
      authentication: '<i class="fas fa-lock text-danger"></i>',
      permission: '<i class="fas fa-ban text-danger"></i>',
      server: '<i class="fas fa-server text-danger"></i>',
    };
    return icons[type] || icons.error;
  },

  _getTypeLabel: (type) => {
    const labels = {
      error: "Error",
      warning: "Warning",
      info: "Info",
      success: "Success",
      validation: "Validation Error",
      network: "Network Error",
      authentication: "Authentication Error",
      permission: "Permission Error",
      server: "Server Error",
    };
    return labels[type] || "Error";
  },
};
