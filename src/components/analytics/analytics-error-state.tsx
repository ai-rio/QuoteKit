"use client"

/**
 * Analytics Error State Component
 * FB-013: Error handling for analytics dashboard
 */

import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedButton } from '@/components/ui/enhanced-button';

import type { AnalyticsErrorProps } from './types';

export function AnalyticsErrorState({
  title = "Error Loading Data",
  message,
  onRetry,
  variant = "card"
}: AnalyticsErrorProps) {
  const getErrorIcon = () => {
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('connection')) {
      return WifiOff;
    }
    return AlertTriangle;
  };

  const ErrorIcon = getErrorIcon();
  const isNetworkError = message.toLowerCase().includes('network') || message.toLowerCase().includes('connection');

  if (variant === 'banner') {
    return (
      <Alert className="border-l-4 border-l-red-500 bg-red-50 border-red-200">
        <ErrorIcon className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-800 font-semibold">
          {title}
        </AlertTitle>
        <AlertDescription className="text-red-700 mt-2">
          <div className="space-y-3">
            <p>{message}</p>
            {onRetry && (
              <EnhancedButton 
                variant="outline-destructive" 
                size="sm" 
                onClick={onRetry}
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </EnhancedButton>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <ErrorIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">{title}</p>
          <p className="text-xs text-red-600">{message}</p>
        </div>
        {onRetry && (
          <EnhancedButton 
            variant="ghost" 
            size="icon-sm" 
            onClick={onRetry}
            className="text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4" />
          </EnhancedButton>
        )}
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className="bg-paper-white border-stone-gray shadow-sm border-l-4 border-l-red-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ErrorIcon className="h-6 w-6 text-red-600" />
            <div>
              <CardTitle className="text-lg text-red-800">
                {title}
              </CardTitle>
            </div>
          </div>
          <Badge variant="destructive">
            {isNetworkError ? 'Connection Error' : 'Error'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-700">
          {message}
        </p>
        
        {isNetworkError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-600 font-medium mb-2">
              Troubleshooting Tips:
            </p>
            <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
              <li>Check your internet connection</li>
              <li>Verify Formbricks API credentials</li>
              <li>Ensure the Formbricks service is accessible</li>
            </ul>
          </div>
        )}
        
        {onRetry && (
          <div className="flex space-x-2">
            <EnhancedButton 
              variant="outline-destructive" 
              size="sm" 
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </EnhancedButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}