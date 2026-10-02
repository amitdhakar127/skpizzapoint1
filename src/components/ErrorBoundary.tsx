import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, UtensilsCrossed } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  isRoot?: boolean;
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
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.hash = '/';
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.isRoot) {
        return (
          <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-xl p-8 rounded-3xl bg-white border-4 border-amber-400 shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E1915]">
                {this.props.fallbackTitle || 'Safe Offline / Local Mode Active'}
              </h2>
              <p className="text-xs sm:text-sm text-[#55473E] leading-relaxed max-w-md mx-auto">
                {this.props.fallbackMessage ||
                  'Your website layout, saved orders, and local data are completely safe. An error boundary caught an issue and prevented the website from going blank.'}
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload View</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Home className="w-4 h-4" />
                  <span>Return to Home</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="p-5 rounded-2xl bg-amber-50/90 border-2 border-amber-400 text-amber-950 space-y-3 text-center my-3 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h4 className="font-black text-xs uppercase tracking-wider">
              {this.props.fallbackTitle || 'Safe Fallback View Active'}
            </h4>
          </div>
          <p className="text-xs text-amber-900/90 max-w-lg mx-auto">
            {this.props.fallbackMessage ||
              'A component encountered a temporary network or display glitch. Your data is stored safely in local storage.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
