import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, RefreshCw, Home } from "lucide-react-native";
import { colors, borderRadius, spacing, fontSize, glass, shadows } from "@/constants/theme";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Child component'lerde crash olduğunda fallback UI gösterir
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // State'i güncelle, bir sonraki render'da fallback UI göster
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Hata loglama
    console.error("Error Boundary caught an error:", error, errorInfo);

    // Optional: Error tracking service'e gönder (Sentry, Bugsnag, etc.)
    // logErrorToService(error, errorInfo);

    // Custom error handler callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    // App'i ana ekrana yönlendir (navigation kullanılabilir)
    // router.push("/"); veya navigation.reset(...)
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component varsa kullan
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return (this.props.fallback as (error: Error, retry: () => void) => ReactNode)(
            this.state.error!,
            this.handleRetry
          );
        } else {
          return this.props.fallback as ReactNode;
        }
      }

      // Varsayılan fallback UI
      return (
        <SafeAreaView style={styles.container} edges={["top"]}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={64} color={colors.danger} />
            </View>

            <Text style={styles.title}>Bir Hata Oluştu</Text>

            <Text style={styles.message}>
              Uygulama beklenmeyen bir hata ile karşılaştı. Endişelenmeyin, bu
              bizim hatamız değil.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Hata Detayları (Dev Mode)</Text>
                <ScrollView style={styles.errorScroll}>
                  <Text style={styles.errorText}>
                    {this.state.error.toString()}
                    {"\n\n"}
                    {this.state.error.stack}
                  </Text>
                </ScrollView>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
              >
                <RefreshCw size={20} color={colors.white} />
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeButton}
                onPress={this.handleGoHome}
              >
                <Home size={20} color={colors.primary} />
                <Text style={styles.homeButtonText}>Ana Sayfa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

/**
 * Error Boundary hook (functional components için)
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error; // Error Boundary'yi tetikle
  };
}

/**
 * Custom Error Fallback Component
 */
interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

export function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <View style={styles.fallbackContainer}>
      <AlertTriangle size={48} color={colors.danger} />
      <Text style={styles.fallbackTitle}>Bir Şeyler Ters Gitti</Text>
      <Text style={styles.fallbackMessage}>
        {error.message || "Beklenmeyen bir hata oluştu."}
      </Text>
      <TouchableOpacity style={styles.fallbackRetryButton} onPress={retry}>
        <RefreshCw size={18} color={colors.white} />
        <Text style={styles.fallbackRetryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Async Error Boundary (Promise rejection'lar için)
 */
export function withAsyncErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorDetails: {
    width: "100%",
    backgroundColor: glass.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.sm,
    fontWeight: "bold",
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  errorScroll: {
    maxHeight: 200,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  actions: {
    width: "100%",
    gap: spacing.md,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.white,
  },
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.border,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  homeButtonText: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.primary,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.card,
  },
  fallbackTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.md,
  },
  fallbackMessage: {
    fontSize: fontSize.md,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  fallbackRetryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  fallbackRetryButtonText: {
    fontSize: fontSize.md,
    fontWeight: "bold",
    color: colors.white,
  },
});
