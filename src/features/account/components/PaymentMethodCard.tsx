'use client';

import { useState } from 'react';
import { Check, CreditCard, Loader2, MoreVertical, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    country: string;
    exp_month: number;
    exp_year: number;
    last4: string;
    funding: string;
  };
  created: number;
  customer: string;
  is_default?: boolean;
}

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onDelete: (id: string) => Promise<void>;
  onSetDefault: (id: string) => Promise<void>;
  isDeleting?: boolean;
  isSettingDefault?: boolean;
}

export function PaymentMethodCard({
  paymentMethod,
  onDelete,
  onSetDefault,
  isDeleting = false,
  isSettingDefault = false,
}: PaymentMethodCardProps) {
  const [showActions, setShowActions] = useState(false);
  const { toast } = useToast();

  const getBrandIcon = (brand: string) => {
    // Enhanced brand icons - you could replace with actual brand SVGs
    const brandColors = {
      visa: 'text-blue-600',
      mastercard: 'text-red-600',
      amex: 'text-green-600',
      discover: 'text-orange-600',
      diners: 'text-purple-600',
      jcb: 'text-indigo-600',
      unionpay: 'text-red-500',
    };

    const colorClass = brandColors[brand as keyof typeof brandColors] || 'text-charcoal/60';
    
    return <CreditCard className={`h-5 w-5 ${colorClass}`} />;
  };

  const formatExpiryDate = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  const formatCardBrand = (brand: string) => {
    const brandNames = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'American Express',
      discover: 'Discover',
      diners: 'Diners Club',
      jcb: 'JCB',
      unionpay: 'UnionPay',
    };

    return brandNames[brand as keyof typeof brandNames] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const handleDelete = async () => {
    try {
      await onDelete(paymentMethod.id);
      toast({
        title: 'Success',
        description: 'Payment method deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment method',
        variant: 'destructive',
      });
    }
    setShowActions(false);
  };

  const handleSetDefault = async () => {
    try {
      await onSetDefault(paymentMethod.id);
      toast({
        title: 'Success',
        description: 'Default payment method updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update default payment method',
        variant: 'destructive',
      });
    }
    setShowActions(false);
  };

  const isExpiringSoon = () => {
    if (!paymentMethod.card) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const { exp_year, exp_month } = paymentMethod.card;
    
    // Check if card expires within the next 3 months
    if (exp_year === currentYear) {
      return exp_month - currentMonth <= 3 && exp_month >= currentMonth;
    } else if (exp_year === currentYear + 1) {
      return currentMonth >= 10 && exp_month <= 3;
    }
    
    return false;
  };

  const isExpired = () => {
    if (!paymentMethod.card) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const { exp_year, exp_month } = paymentMethod.card;
    
    return exp_year < currentYear || (exp_year === currentYear && exp_month < currentMonth);
  };

  return (
    <Card className={`bg-paper-white border-stone-gray transition-all duration-200 hover:shadow-md ${
      paymentMethod.is_default ? 'ring-2 ring-forest-green/20' : ''
    } ${isExpired() ? 'border-red-200 bg-red-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Card Icon */}
            <div className="w-12 h-8 bg-stone-gray/10 rounded-md flex items-center justify-center border border-stone-gray/20">
              {getBrandIcon(paymentMethod.card?.brand || 'unknown')}
            </div>

            {/* Card Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-charcoal text-base">
                  {formatCardBrand(paymentMethod.card?.brand || 'Unknown')}
                </p>
                <span className="text-charcoal/60">••••</span>
                <span className="font-mono text-charcoal font-medium">
                  {paymentMethod.card?.last4 || '****'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-charcoal/70">
                  Expires {paymentMethod.card ? formatExpiryDate(paymentMethod.card.exp_month, paymentMethod.card.exp_year) : 'Unknown'}
                </p>
                
                {paymentMethod.card?.funding && (
                  <span className="text-xs text-charcoal/60 capitalize bg-stone-gray/20 px-2 py-1 rounded-full">
                    {paymentMethod.card.funding}
                  </span>
                )}
              </div>

              {/* Status Indicators */}
              <div className="flex items-center space-x-2 mt-2">
                {paymentMethod.is_default && (
                  <Badge className="bg-forest-green text-paper-white text-xs">
                    Default
                  </Badge>
                )}
                
                {isExpired() && (
                  <Badge variant="destructive" className="text-xs">
                    Expired
                  </Badge>
                )}
                
                {isExpiringSoon() && !isExpired() && (
                  <Badge className="bg-equipment-yellow text-charcoal text-xs">
                    Expires Soon
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile-friendly actions */}
            <div className="hidden sm:flex space-x-2">
              {!paymentMethod.is_default && !isExpired() && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-stone-gray text-charcoal hover:bg-stone-gray/10"
                  onClick={handleSetDefault}
                  disabled={isSettingDefault}
                >
                  {isSettingDefault ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  Set Default
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Mobile dropdown menu */}
            <div className="sm:hidden">
              <DropdownMenu open={showActions} onOpenChange={setShowActions}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {!paymentMethod.is_default && !isExpired() && (
                    <DropdownMenuItem
                      onClick={handleSetDefault}
                      disabled={isSettingDefault}
                      className="text-charcoal"
                    >
                      {isSettingDefault ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Set as Default
                    </DropdownMenuItem>
                  )}
                  
                  {!paymentMethod.is_default && !isExpired() && (
                    <DropdownMenuSeparator />
                  )}
                  
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-600 focus:text-red-600"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Payment Method
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(isExpired() || isExpiringSoon()) && (
          <div className="mt-3 pt-3 border-t border-stone-gray/30">
            <p className="text-sm text-charcoal/70">
              {isExpired() 
                ? '⚠️ This card has expired. Please add a new payment method.'
                : '⏰ This card expires soon. Consider adding a new payment method.'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
