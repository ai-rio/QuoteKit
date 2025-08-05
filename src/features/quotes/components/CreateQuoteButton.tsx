'use client'

import { AlertCircle,Crown, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

interface CreateQuoteButtonProps {
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  iconOnly?: boolean
  children?: React.ReactNode
}

export function CreateQuoteButton({
  variant = 'default',
  size = 'default',
  className = '',
  iconOnly = false,
  children
}: CreateQuoteButtonProps) {
  const router = useRouter()
  const { canAccess } = useFeatureAccess()

  // Check quote creation access
  const quoteAccess = canAccess('max_quotes')

  const handleCreateQuote = () => {
    if (!quoteAccess.hasAccess) {
      // For now, just show an alert - we can enhance this later
      alert('You have reached your quote limit. Please upgrade to create more quotes.')
      return
    }

    // Navigate to quote creation
    router.push('/quotes/new')
  }

  const buttonText = children || (iconOnly ? '' : 'Create New Quote')
  
  return (
    <Button
      onClick={handleCreateQuote}
      variant={variant}
      size={size}
      className={`${className} bg-forest-green text-white hover:opacity-90 font-bold`}
      disabled={quoteAccess.isAtLimit}
    >
      <Plus className="w-4 h-4 mr-2" />
      {buttonText}
      {quoteAccess.isAtLimit && <AlertCircle className="w-4 h-4 ml-2 text-error-red" />}
    </Button>
  )
}

export function CompactCreateQuoteButton({
  className = ''
}: {
  className?: string
}) {
  return (
    <CreateQuoteButton
      variant="outline"
      size="sm"
      iconOnly={true}
      className={className}
    />
  )
}
