import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Initialize state as a class property. This is a more modern approach
  // and can resolve issues with some TypeScript configurations not recognizing
  // state initialized within the constructor. This fixes the errors related to
  // `this.state` and `this.props` not being found on the component type.
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="h-full w-full flex items-center justify-center text-center p-4">
            <div>
                <h1 className="text-2xl font-bold text-red-500">Something went wrong.</h1>
                <p className="mt-2 text-medium-dark-text dark:text-medium-text">An unexpected error occurred. Please try refreshing the page.</p>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
