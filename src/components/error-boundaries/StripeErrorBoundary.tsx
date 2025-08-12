'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class StripeErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('StripeErrorBoundary: Stripe component error caught:', error, errorInfo);
    
    // Log specific Stripe errors for debugging
    if (error.message.includes('Stripe') || error.message.includes('loadStripe')) {
      console.error('StripeErrorBoundary: This appears to be a Stripe-related error');
    }

    this.setState({
      error,
      errorInfo
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Card className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg">
          <CardHeader className="p-8">
            <CardTitle className="text-xl md:text-2xl font-bold text-forest-green">
              {this.props.title || 'Payment System Error'}
            </CardTitle>
            <CardDescription className="text-lg text-charcoal">
              {this.props.description || 'Something went wrong with the payment system'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Card className="bg-red-50 border-red-200 mb-6 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-red-800 text-base">Component Error</p>
                    <p className="text-base text-red-600 mt-1">
                      {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      This might be due to Stripe connectivity issues, ad blockers, or browser security settings.
                    </p>
                    
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                      <details className="mt-4">
                        <summary className="text-sm text-red-600 cursor-pointer">
                          Show technical details (development only)
                        </summary>
                        <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap bg-red-100 p-2 rounded">
                          {this.state.error?.stack}
                          {'\n\n'}
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-3 text-center">
              <Button 
                className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
                onClick={this.handleRetry}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                className="bg-equipment-yellow border-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold px-6 py-3 rounded-lg transition-all duration-200"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}