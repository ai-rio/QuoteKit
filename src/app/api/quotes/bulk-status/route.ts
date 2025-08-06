import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { FREE_PLAN_FEATURES, parseStripeMetadata } from '@/types/features';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get data from request body
    const { quoteIds, status } = await request.json();
    
    if (!Array.isArray(quoteIds) || quoteIds.length === 0) {
      return NextResponse.json({ error: 'Invalid quote IDs provided' }, { status: 400 });
    }

    if (!status || !['draft', 'sent', 'accepted', 'declined', 'expired', 'converted'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
    }

    // Check bulk operations feature access
    const bulkAccess = await checkBulkOperationsAccess(user.id, supabase, quoteIds.length);
    if (!bulkAccess.hasAccess) {
      return NextResponse.json({
        error: 'Bulk operations not available',
        message: bulkAccess.message,
        upgradeRequired: true,
        feature: 'bulk_operations',
        limit: bulkAccess.limit,
        requested: quoteIds.length
      }, { status: 403 });
    }

    // Verify all quotes belong to the user before updating
    const { data: existingQuotes, error: verifyError } = await supabase
      .from('quotes')
      .select('id')
      .in('id', quoteIds)
      .eq('user_id', user.id);

    if (verifyError) {
      return NextResponse.json({ error: 'Failed to verify quotes' }, { status: 500 });
    }

    const validQuoteIds = existingQuotes?.map(quote => quote.id) || [];
    const invalidCount = quoteIds.length - validQuoteIds.length;

    if (validQuoteIds.length === 0) {
      return NextResponse.json({ error: 'No valid quotes found for update' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Set sent_at timestamp if status is 'sent'
    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }

    // Update the quotes
    const { data: updatedQuotes, error: updateError } = await supabase
      .from('quotes')
      .update(updateData)
      .in('id', validQuoteIds)
      .select('id, status, updated_at, sent_at');

    if (updateError) {
      console.error('Error updating quote statuses:', updateError);
      return NextResponse.json({ error: 'Failed to update quote statuses' }, { status: 500 });
    }

    // Increment bulk operations usage counter
    const { error: usageError } = await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_usage_type: 'bulk_operations',
      p_amount: 1
    });

    if (usageError) {
      console.error('Error incrementing bulk operations usage:', usageError);
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedQuotes?.length || 0,
      invalidCount,
      updatedQuotes,
      message: `Successfully updated ${updatedQuotes?.length || 0} quotes to ${status}`
    });

  } catch (error) {
    console.error('Error in bulk status update operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk status update' },
      { status: 500 }
    );
  }
}

/**
 * Check if user can perform bulk operations based on their subscription
 */
async function checkBulkOperationsAccess(userId: string, supabase: any, operationCount: number = 1) {
  try {
    // Get user's subscription and features
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stripe_prices!inner (
          *,
          stripe_products!inner (
            metadata
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Parse features from subscription or use free plan defaults
    let features = FREE_PLAN_FEATURES;
    if (subscription?.stripe_prices?.stripe_products?.metadata) {
      features = parseStripeMetadata(subscription.stripe_prices.stripe_products.metadata);
    }

    // Check bulk operations access
    if (!features.bulk_operations) {
      return {
        hasAccess: false,
        message: 'Bulk operations are a premium feature. Upgrade to Pro to perform bulk actions on multiple quotes.',
        limit: 1
      };
    }

    // Check operation count limits for different tiers
    const limits = getBulkOperationLimits(features);
    if (operationCount > limits.maxItemsPerOperation) {
      return {
        hasAccess: false,
        message: `Bulk operation limit exceeded. You can process up to ${limits.maxItemsPerOperation} items at once.`,
        limit: limits.maxItemsPerOperation
      };
    }

    return {
      hasAccess: true,
      limit: limits.maxItemsPerOperation
    };

  } catch (error) {
    console.error('Error checking bulk operations access:', error);
    // On error, deny access to be safe
    return {
      hasAccess: false,
      message: 'Unable to verify bulk operations access. Please try again.',
      limit: 0
    };
  }
}

/**
 * Get bulk operation limits based on plan features
 */
function getBulkOperationLimits(features: any) {
  // Pro plans get higher limits
  if (features.max_quotes === -1) { // Unlimited quotes indicates pro plan
    return {
      maxItemsPerOperation: 100
    };
  }
  
  // Premium plans get moderate limits
  if (features.bulk_operations) {
    return {
      maxItemsPerOperation: 25
    };
  }

  // Free plans don't get bulk operations
  return {
    maxItemsPerOperation: 1
  };
}