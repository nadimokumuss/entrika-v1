import { useState, useCallback } from "react";

type ErrorType = "network" | "server" | "timeout" | "unauthorized" | "general";

interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  retryable?: boolean;
}

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

export function getErrorType(error: any): ErrorType {
  if (!error) return "general";

  const message = error.message?.toLowerCase() || "";
  const code = error.code?.toLowerCase() || "";

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    code.includes("network")
  ) {
    return "network";
  }

  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    code.includes("timeout")
  ) {
    return "timeout";
  }

  if (
    message.includes("unauthorized") ||
    message.includes("auth") ||
    message.includes("token") ||
    code.includes("auth")
  ) {
    return "unauthorized";
  }

  if (error.status >= 500 || error.statusCode >= 500) {
    return "server";
  }

  return "general";
}

export function createError(error: any, customMessage?: string): AppError {
  const type = getErrorType(error);
  const message =
    customMessage ||
    error.message ||
    "Bir hata olustu. Lutfen tekrar deneyin.";

  return {
    type,
    message,
    originalError: error,
    retryable: type === "network" || type === "timeout",
  };
}

export type { ErrorType, AppError };

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
        const delay = delayMs * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
