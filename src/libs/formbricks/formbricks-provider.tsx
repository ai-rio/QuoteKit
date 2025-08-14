'use client';

import { User } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { useUser } from '@/hooks/use-user';

import { FormbricksManager } from './formbricks-manager';
import { FormbricksUserAttributes } from './types';

/**
 * FormbricksProvider - React component that initializes Formbricks SDK
 * and handles user context synchronization throughout the app
 */
export function FormbricksProvider() {
  const { data: user } = useUser();

  useEffect(() => {
    // Only initialize if we have environment variables configured
    const environmentId = process.env.NEXT_PUBLIC_FORMBRICKS_ENV_ID;
    const appUrl = process.env.NEXT_PUBLIC_FORMBRICKS_API_HOST;

    if (!environmentId) {
      console.warn('Formbricks environment ID not configured, skipping initialization');
      return;
    }

    const manager = FormbricksManager.getInstance();
    
    // Initialize Formbricks SDK
    manager.initialize({
      environmentId,
      appUrl,
    });
  }, []);

  useEffect(() => {
    if (user) {
      const manager = FormbricksManager.getInstance();
      
      // Set user attributes for personalized surveys
      const attributes = mapUserToFormbricksAttributes(user);
      manager.setAttributes(attributes);
    }
  }, [user]);

  return null; // This component doesn't render anything
}

/**
 * Maps QuoteKit user data to Formbricks user attributes
 */
function mapUserToFormbricksAttributes(user: User): FormbricksUserAttributes {
  const attributes: FormbricksUserAttributes = {
    email: user.email,
    signupDate: user.created_at,
    lastActive: user.last_sign_in_at || undefined,
  };

  // Add additional user metadata if available
  if (user.user_metadata) {
    const metadata = user.user_metadata;
    
    if (metadata.subscriptionTier) {
      attributes.subscriptionTier = metadata.subscriptionTier;
    }
    
    if (metadata.quotesCreated) {
      attributes.quotesCreated = metadata.quotesCreated;
    }
    
    if (metadata.revenue) {
      attributes.revenue = metadata.revenue;
    }
    
    if (metadata.industry) {
      attributes.industry = metadata.industry;
    }
    
    if (metadata.companySize) {
      attributes.companySize = metadata.companySize;
    }
  }

  return attributes;
}