import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Toast, ToastType } from "@/components/ui/Toast";

interface ToastMessage {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: ToastMessage) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
  children: ReactNode;
  position?: "top" | "bottom" | "center";
}

let toastId = 0;

/**
 * Toast Provider Component
 */
export function ToastProvider({
  children,
  position = "top",
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<
    Array<{ id: string; toast: ToastMessage }>
  >([]);

  const showToast = useCallback((toast: ToastMessage) => {
    const id = `toast-${toastId++}`;
    const newToast = { id, toast };

    setToasts((prev) => [...prev, newToast]);

    // Duration'dan sonra kaldır
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 3000);
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "success", title, message });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "error", title, message });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "info", title, message });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: "warning", title, message });
    },
    [showToast]
  );

  const value = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map(({ id, toast }) => (
        <Toast
          key={id}
          toast={{
            id,
            ...toast,
          }}
          onHide={() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
          }}
          position={position}
        />
      ))}
    </ToastContext.Provider>
  );
}

/**
 * useToast Hook
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}

/**
 * Convenience hook for toast notifications
 */
export function useToasts() {
  const {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  } = useToast();

  return {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
  };
}

/**
 * Toast promise wrapper
 * Async işlemler için otomatik toast gösterimi
 */
export async function withToast<T>(
  context: ToastContextType,
  promise: Promise<T>,
  options: {
    success?: string;
    error?: string;
    successMessage?: string;
    errorMessage?: string;
  } = {}
): Promise<T> {
  const { showSuccess, showError } = context;

  try {
    const result = await promise;

    if (options.success || options.successMessage) {
      showSuccess(options.success || options.successMessage || "Başarılı!");
    }

    return result;
  } catch (error: any) {
    const errorMsg =
      options.errorMessage ||
      error.message ||
      options.error ||
      "Bir hata oluştu.";

    showError(options.error || errorMsg);

    throw error;
  }
}
