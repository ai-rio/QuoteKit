'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, disabled, className, indeterminate, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    React.useImperativeHandle(ref, () => inputRef.current!);
    
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate || false;
      }
    }, [indeterminate]);

    return (
      <div className="relative inline-flex items-center">
        <input
          ref={inputRef}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <div
          className={`h-4 w-4 rounded-sm border border-stone-gray bg-white flex items-center justify-center cursor-pointer transition-colors ${
            checked ? 'bg-forest-green border-forest-green' : 'hover:border-forest-green/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
          onClick={() => !disabled && onCheckedChange?.(!checked)}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };