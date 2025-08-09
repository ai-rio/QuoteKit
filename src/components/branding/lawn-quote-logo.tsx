import React from 'react'

interface LawnQuoteLogoProps {
  className?: string
  width?: number
  height?: number
  showText?: boolean
  textClassName?: string
}

export function LawnQuoteLogo({ 
  className, 
  width = 40, 
  height = 40, 
  showText = false,
  textClassName = ''
}: LawnQuoteLogoProps) {
  return (
    <div className="flex items-center space-x-3">
      {/* Logo Icon */}
      <div 
        className={`bg-forest-green rounded-lg flex items-center justify-center ${className}`}
        style={{ width: width, height: height }}
      >
        <span className="font-black text-paper-white text-xl">LQ</span>
      </div>
      
      {/* Optional Text */}
      {showText && (
        <span className={`font-bold text-2xl text-charcoal ${textClassName}`}>
          LawnQuote
        </span>
      )}
    </div>
  )
}

// Icon-only version for compact usage
export function LawnQuoteLogoIcon({ className, width = 40, height = 40 }: Omit<LawnQuoteLogoProps, 'showText' | 'textClassName'>) {
  return (
    <div 
      className={`bg-forest-green rounded-lg flex items-center justify-center ${className}`}
      style={{ width: width, height: height }}
    >
      <span className="font-black text-paper-white text-xl">LQ</span>
    </div>
  )
}

// Horizontal version with text
export function LawnQuoteLogoHorizontal({ className = '', textClassName = '' }: Pick<LawnQuoteLogoProps, 'className' | 'textClassName'>) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="w-10 h-10 bg-forest-green rounded-lg flex items-center justify-center">
        <span className="font-black text-paper-white text-xl">LQ</span>
      </div>
      <span className={`font-bold text-2xl text-charcoal ${textClassName}`}>
        LawnQuote
      </span>
    </div>
  )
}

// Legacy compatibility - keeping the old export names but using new design
export const QuoteKitLogo = LawnQuoteLogo
export const QuoteKitLogoIcon = LawnQuoteLogoIcon
export const QuoteKitLogoHorizontal = LawnQuoteLogoHorizontal