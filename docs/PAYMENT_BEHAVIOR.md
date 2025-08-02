# Payment Behavior Configuration

## Overview

The LawnQuote billing system is configured for **immediate payment processing** rather than invoice generation. This ensures users must pay upfront to access paid features.

## Payment Flow

### For Paid Subscriptions

1. **Payment Method Required**: Users must provide a valid payment method
2. **Immediate Processing**: Payment is processed immediately using `payment_behavior = 'error_if_incomplete'`
3. **Success or Failure**: Either the payment succeeds and subscription is activated, or it fails with a clear error message
4. **Receipt Generation**: Successful payments generate receipts (not invoices)

### For Free Subscriptions

1. **No Payment Method Required**: Free plans don't require payment methods
2. **Immediate Activation**: Free subscriptions are activated immediately

## Key Configuration

### Stripe Subscription Creation

```typescript
// For paid subscriptions with payment method
subscriptionCreateParams.payment_behavior = 'error_if_incomplete';
subscriptionCreateParams.expand = ['latest_invoice.payment_intent'];

// For free subscriptions
subscriptionCreateParams.payment_behavior = 'allow_incomplete';
```

### Error Handling

The system handles specific payment errors:

- **Card Declined**: Clear message to try different payment method
- **Insufficient Funds**: Guidance to check account balance
- **Expired Card**: Prompt to update payment method
- **Incorrect CVC**: Request to verify card details
- **Generic Card Errors**: Display Stripe's error message

### Billing History

Successful payments are recorded as:

```typescript
{
  status: 'paid',
  description: 'Payment for Premium Plan',
  stripe_invoice_id: 'in_xxx', // For receipt access
  invoice_url: 'https://...'   // Direct receipt link
}
```

## Benefits

1. **Immediate Access Control**: Users get instant access after successful payment
2. **Clear Payment Status**: No ambiguity about payment completion
3. **Better User Experience**: No waiting for invoice payment
4. **Reduced Support**: Clear error messages for payment failures
5. **Compliance**: Proper receipts for accounting purposes

## Testing

The payment behavior can be tested using the Stripe test cards:

- **Success**: `4242424242424242`
- **Declined**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`
- **Expired Card**: `4000000000000069`

## Migration from Invoice-Based System

If migrating from an invoice-based system:

1. Update `payment_behavior` from `'default_incomplete'` to `'error_if_incomplete'`
2. Add payment method validation for paid plans
3. Update billing history descriptions from "Subscription to" to "Payment for"
4. Handle payment errors appropriately
5. Test with various payment scenarios
