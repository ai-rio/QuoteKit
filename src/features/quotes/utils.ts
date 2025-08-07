// src/features/quotes/utils.ts
import { QuoteCalculation } from './types';

// Utility function to calculate quote totals
export function calculateQuote(
  lineItems: { cost: number; quantity: number }[],
  taxRate: number,
  markupRate: number
): QuoteCalculation {
  // Defensive programming: ensure lineItems is always an array
  const safeLineItems = Array.isArray(lineItems) ? lineItems : [];
  
  const subtotal = safeLineItems.reduce((sum, item) => {
    // Additional safety: ensure item has numeric cost and quantity
    const cost = typeof item?.cost === 'number' ? item.cost : 0;
    const quantity = typeof item?.quantity === 'number' ? item.quantity : 0;
    return sum + (cost * quantity);
  }, 0);
  
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