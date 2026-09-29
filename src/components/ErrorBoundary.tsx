import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global ErrorBoundary caught error:', error, errorInfo);

    // Keep a small diagnostic record locally so a production crash can be
    // identified without exposing internal error details in the UI.
    try {
      localStorage.setItem(
        'sk_pizza_last_runtime_error',
        JSON.stringify({
          message: error?.message || 'Unknown error',
          name: error?.name || 'Error',
          stack: error?.stack || '',
          componentStack: errorInfo?.componentStack || '',
          path: typeof window !== 'undefined' ? window.location.href : '',
          timestamp: new Date().toISOString(),
        })
      );
    } catch {
      // Diagnostics must never become another source of failure.
    }
  }

  private handleReset = () => {
    // Reset the boundary first. If the same render path is still broken,
    // reload the document so the React tree and Firebase client start cleanly.
    this.setState({ hasError: false, error: null });
    setTimeout(() => {
      try {
        window.location.reload();
      } catch {
        // Ignore reload failures; the boundary remains available.
      }
    }, 0);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-amber-300 shadow-xl p-6 sm:p-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-amber-800">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <h1 className="font-black text-lg sm:text-xl">Temporary App Error</h1>
            </div>
            <p className="text-sm text-neutral-700 leading-6">
              The app hit a temporary problem while rendering this page. Your saved order data is preserved locally. Please reload the app to continue.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
