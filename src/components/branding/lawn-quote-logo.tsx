import React from 'react'

interface LawnQuoteLogoProps {
  className?: string
  width?: number
  height?: number
}

export function LawnQuoteLogo({ className, width = 40, height = 40 }: LawnQuoteLogoProps) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 100" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="100" fill="currentColor"/>
      <rect x="40" y="60" width="60" height="40" fill="currentColor"/>
      <circle cx="80" cy="50" r="30" fill="currentColor"/>
      <circle cx="80" cy="50" r="15" fill="hsl(var(--forest-green))"/>
    </svg>
  )
}