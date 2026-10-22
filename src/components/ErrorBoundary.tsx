import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              +
            </div>
            <h1 className="text-xl font-bold text-slate-900">We Care Multispeciality Hospital</h1>
            <p className="text-sm text-slate-600">
              The application encountered an unexpected issue while loading. Please refresh the page to restore your session.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-md"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
