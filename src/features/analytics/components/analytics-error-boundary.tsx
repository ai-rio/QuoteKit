/**
 * Analytics Error Boundary Component
 * 
 * Catches and handles errors in the analytics dashboard,
 * providing user-friendly error messages and recovery options.
 */

'use client';

import { 
  AlertTriangle, 
  Bug, 
  ChevronRight,
  Home,
  RefreshCw} from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class AnalyticsErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analytics Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You could send error to monitoring service here
    // Example: errorReportingService.captureException(error, { context: errorInfo });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/admin-dashboard';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full bg-white border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-charcoal">
            Something went wrong with the analytics dashboard
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <Bug className="h-4 w-4" />
            <AlertDescription className="font-mono text-sm">
              {error.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <p className="text-sm text-charcoal/70 text-center">
              This error has been logged. You can try one of the following options:
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={resetError}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={handleReload}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              
              <Button 
                onClick={handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-charcoal/60 bg-gray-50 p-4 rounded-md">
              <summary className="cursor-pointer font-medium mb-2">
                Development Error Details
              </summary>
              <pre className="whitespace-pre-wrap overflow-x-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Analytics-specific error fallback component
 */
export function AnalyticsErrorFallback({ error, resetError }: DefaultErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  const isAuthError = error.message.includes('auth') || error.message.includes('unauthorized');
  const isFormbricksError = error.message.includes('formbricks') || error.message.includes('api');

  const getErrorSuggestion = () => {
    if (isAuthError) {
      return {
        title: "Authentication Issue",
        description: "You may need to log in again or check your admin permissions.",
        action: "Check Authentication",
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    }
    
    if (isNetworkError) {
      return {
        title: "Network Error",
        description: "Check your internet connection and try again.",
        action: "Retry Connection",
        icon: <RefreshCw className="h-4 w-4" />,
      };
    }
    
    if (isFormbricksError) {
      return {
        title: "Formbricks API Error",
        description: "There may be an issue with the Formbricks service or configuration.",
        action: "Check Configuration",
        icon: <Bug className="h-4 w-4" />,
      };
    }

    return {
      title: "Unexpected Error",
      description: "An unexpected error occurred while loading the analytics dashboard.",
      action: "Try Again",
      icon: <AlertTriangle className="h-4 w-4" />,
    };
  };

  const suggestion = getErrorSuggestion();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-charcoal/70">
        <span>Admin</span>
        <ChevronRight className="h-4 w-4" />
        <span>Analytics</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-red-600">Error</span>
      </div>

      <Card className="bg-white border-red-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              {suggestion.icon}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-charcoal mb-2">
                {suggestion.title}
              </h2>
              <p className="text-charcoal/70 mb-4">
                {suggestion.description}
              </p>
            </div>

            <Alert variant="destructive" className="border-red-200 bg-red-50 text-left">
              <AlertDescription className="font-mono text-sm break-words">
                {error.message}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={resetError}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {suggestion.action}
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Reload Page
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/admin-dashboard'}
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}