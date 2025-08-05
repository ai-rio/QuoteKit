'use client';

import { Calculator, DollarSign } from 'lucide-react';
import React from 'react';

interface MaterialCostItem {
  item: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  notes?: string;
}

interface MaterialCostTableProps {
  data: MaterialCostItem[];
  title?: string;
  showTotal?: boolean;
  className?: string;
}

/**
 * MaterialCostTable Component
 * 
 * Professional table for displaying material costs and calculations.
 * Optimized for landscaping and construction cost breakdowns.
 * 
 * Features:
 * - Responsive table design with mobile card layout
 * - Monospace font for financial data (Roboto Mono)
 * - Professional styling with proper alignment
 * - Optional total calculation display
 * - Accessible table structure with proper headers
 * - WCAG AAA compliant colors and typography
 * 
 * @param data - Array of material cost items
 * @param title - Optional table title (defaults to "Material Cost Breakdown")
 * @param showTotal - Whether to display a total row (defaults to true)
 * @param className - Optional additional CSS classes
 */
export function MaterialCostTable({ 
  data, 
  title = "Material Cost Breakdown",
  showTotal = true,
  className = "" 
}: MaterialCostTableProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Calculate total if showTotal is enabled
  const total = showTotal ? data.reduce((sum, item) => {
    const cost = parseFloat(item.totalCost.replace(/[$,]/g, '')) || 0;
    return sum + cost;
  }, 0) : 0;

  return (
    <div className={`my-12 ${className}`}>
      {/* H3 with proper typography hierarchy */}
      <h3 className="
        text-xl 
        md:text-2xl 
        font-bold 
        text-forest-green 
        mb-6 
        flex 
        items-center 
        gap-3
      ">
        <Calculator className="w-6 h-6 text-charcoal" aria-hidden="true" />
        {title}
      </h3>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="
          bg-paper-white 
          rounded-2xl 
          border 
          border-stone-gray/20 
          shadow-lg 
          overflow-hidden
        ">
          <table className="w-full">
            <thead>
              <tr className="bg-light-concrete">
                <th className="
                  text-left 
                  p-6 
                  text-lg 
                  font-bold 
                  text-forest-green
                  border-b 
                  border-stone-gray/20
                ">
                  Item
                </th>
                <th className="
                  text-center 
                  p-6 
                  text-lg 
                  font-bold 
                  text-forest-green
                  border-b 
                  border-stone-gray/20
                ">
                  Quantity
                </th>
                <th className="
                  text-right 
                  p-6 
                  text-lg 
                  font-bold 
                  text-forest-green
                  border-b 
                  border-stone-gray/20
                ">
                  Unit Cost
                </th>
                <th className="
                  text-right 
                  p-6 
                  text-lg 
                  font-bold 
                  text-forest-green
                  border-b 
                  border-stone-gray/20
                ">
                  Total Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr 
                  key={index}
                  className="border-b border-stone-gray/10 last:border-b-0"
                >
                  <td className="p-6">
                    <div>
                      <div className="text-lg text-charcoal font-medium">
                        {item.item}
                      </div>
                      {item.notes && (
                        <div className="text-base text-charcoal/70 mt-1">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="font-mono text-lg text-charcoal">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <span className="font-mono text-lg text-forest-green font-medium">
                      {item.unitCost}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <span className="font-mono text-lg text-forest-green font-bold">
                      {item.totalCost}
                    </span>
                  </td>
                </tr>
              ))}
              
              {showTotal && (
                <tr className="bg-forest-green/5 border-t-2 border-forest-green">
                  <td colSpan={3} className="p-6 text-right">
                    <span className="text-xl font-bold text-forest-green">
                      Total:
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <span className="font-mono text-xl font-black text-forest-green">
                      ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item, index) => (
          <div 
            key={index}
            className="
              bg-paper-white 
              rounded-2xl 
              border 
              border-stone-gray/20 
              shadow-lg 
              p-6
            "
          >
            <div className="space-y-3">
              <div>
                <h4 className="text-lg font-bold text-forest-green">
                  {item.item}
                </h4>
                {item.notes && (
                  <p className="text-base text-charcoal/70 mt-1">
                    {item.notes}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-base text-charcoal/70">Quantity:</span>
                  <div className="font-mono text-lg text-charcoal font-medium">
                    {item.quantity}
                  </div>
                </div>
                <div>
                  <span className="text-base text-charcoal/70">Unit Cost:</span>
                  <div className="font-mono text-lg text-forest-green font-medium">
                    {item.unitCost}
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-stone-gray/20">
                <span className="text-base text-charcoal/70">Total Cost:</span>
                <div className="font-mono text-xl text-forest-green font-bold">
                  {item.totalCost}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {showTotal && (
          <div className="
            bg-forest-green/5 
            rounded-2xl 
            border-2 
            border-forest-green 
            p-6
          ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-forest-green" aria-hidden="true" />
                <span className="text-xl font-bold text-forest-green">
                  Total:
                </span>
              </div>
              <span className="font-mono text-2xl font-black text-forest-green">
                ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialCostTable;
