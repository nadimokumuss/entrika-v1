import { useState, useCallback, useEffect } from "react";

export type ErrorType = "network" | "server" | "timeout" | "unauthorized" | "general";

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  retryable?: boolean;
}

/**
 * Custom hook for error handling
 */
export function useError() {
  const [error, setError] = useState<AppError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setErrorWithType = useCallback(
    (type: ErrorType, message: string, originalError?: any) => {
      setError({
        type,
        message,
        originalError,
        retryable: type === "network" || type === "timeout",
      });
    },
    []
  );

  return {
    error,
    setError,
    clearError,
    setErrorWithType,
    hasError: error !== null,
  };
}

/**
 * Custom hook for retry logic with exponential backoff
 */
export function useRetry() {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async (
      fn: () => Promise<any>,
      maxRetries: number = 3,
      delayMs: number = 1000
    ): Promise<boolean> => {
      if (retryCount >= maxRetries) {
        setRetryCount(0);
        setIsRetrying(false);
        return false;
      }

      setIsRetrying(true);
      setRetryCount((prev) => prev + 1);

      // Exponential backoff delay
      const delay = delayMs * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        await fn();
        setRetryCount(0);
        setIsRetrying(false);
        return true;
      } catch (error) {
        setIsRetrying(false);
        // Retry again recursively
        return retry(fn, maxRetries, delayMs);
      }
    },
    [retryCount]
  );

  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    isRetrying,
    retryCount,
    resetRetryCount,
    canRetry: retryCount < 3,
  };
}

/**
 * Network error checker
 */
export function getErrorType(error: any): ErrorType {
  if (!error) return "general";

  const message = error.message?.toLowerCase() || "";
  const code = error.code?.toLowerCase() || "";

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    code.includes("network")
  ) {
    return "network";
  }

  // Timeout errors
  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    code.includes("timeout")
  ) {
    return "timeout";
  }

  // Auth errors
  if (
    message.includes("unauthorized") ||
    message.includes("auth") ||
    message.includes("token") ||
    code.includes("auth")
  ) {
    return "unauthorized";
  }

  // Server errors (5xx)
  if (error.status >= 500 || error.statusCode >= 500) {
    return "server";
  }

  return "general";
}

/**
 * Create error object from caught error
 */
export function createError(error: any, customMessage?: string): AppError {
  const type = getErrorType(error);
  const message =
    customMessage ||
    error.message ||
    "Bir hata oluştu. Lütfen tekrar deneyin.";

  return {
    type,
    message,
    originalError: error,
    retryable: type === "network" || type === "timeout",
  };
}

/**
 * Custom hook for async operations with error handling
 */
export function useAsyncError<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await fn();
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        const appError = createError(err);
        setError(appError);
        setLoading(false);
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    hasError: error !== null,
  };
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandler() {
  // Global unhandled rejection handler
  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      // Log to error tracking service
      // logErrorToService(event.reason);
      event.preventDefault();
    });

    // Global error handler
    window.addEventListener("error", (event) => {
      console.error("Global error:", event.error);
      // Log to error tracking service
      // logErrorToService(event.error);
    });
  }
}

/**
 * Network error detection hook
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // For React Native
    if (typeof NetInfo !== "undefined") {
      const unsubscribe = NetInfo.addEventListener((state) => {
        setIsOnline(state.isConnected ?? true);
      });
      return () => unsubscribe();
    }

    // For Web
    if (typeof window !== "undefined" && window.navigator) {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}

// Export types
export type { ErrorType, AppError };

/**
 * Wrapper for async functions with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
