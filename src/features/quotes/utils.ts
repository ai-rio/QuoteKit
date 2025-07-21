// src/features/quotes/utils.ts
import { QuoteCalculation } from './types';

// Utility function to calculate quote totals
export function calculateQuote(
  lineItems: { cost: number; quantity: number }[],
  taxRate: number,
  markupRate: number
): QuoteCalculation {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const markupAmount = subtotal * (markupRate / 100);
  const subtotalWithMarkup = subtotal + markupAmount;
  const taxAmount = subtotalWithMarkup * (taxRate / 100);
  const total = subtotalWithMarkup + taxAmount;

  return {
    subtotal,
    taxAmount,
    markupAmount,
    total,
  };
}