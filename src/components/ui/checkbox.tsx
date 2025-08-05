'use client';

import { Check } from 'lucide-react';
import * as React from 'react';

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
          className={`h-5 w-5 rounded-sm border-2 border-stone-gray bg-white flex items-center justify-center cursor-pointer transition-all duration-150 ${
            checked || indeterminate ? 'bg-paper-white border-forest-green shadow-sm' : 'hover:border-forest-green/50 hover:shadow-sm'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}
          onClick={() => !disabled && onCheckedChange?.(!checked)}
        >
          {checked && (
            <Check 
              className="h-4 w-4 text-forest-green stroke-[4] drop-shadow-sm" 
              style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.1))' }}
            />
          )}
          {indeterminate && !checked && (
            <div className="h-2.5 w-2.5 bg-forest-green rounded-sm shadow-sm" />
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };