'use client'

import { AlertCircle, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { useQuoteLimits } from '@/hooks/useFeatureAccess'

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
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const { 
    hasAccess, 
    canCreateQuote, 
    isAtLimit, 
    limit, 
    current, 
    upgradeRequired,
    loading 
  } = useQuoteLimits()

  const handleCreateQuote = () => {
    // If user can't create quotes, show upgrade prompt
    if (!canCreateQuote || upgradeRequired) {
      setShowUpgradePrompt(true)
      return
    }

    // Navigate to quote creation
    router.push('/quotes/new')
  }

  const buttonText = children || (iconOnly ? '' : 'Create New Quote')
  
  // Show different states based on quota
  const getButtonState = () => {
    if (loading) {
      return {
        disabled: true,
        text: buttonText,
        showAlert: false
      }
    }

    if (isAtLimit) {
      return {
        disabled: false, // Allow click to show upgrade prompt
        text: iconOnly ? '' : 'Upgrade to Create More',
        showAlert: true
      }
    }

    if (!hasAccess) {
      return {
        disabled: false, // Allow click to show upgrade prompt
        text: iconOnly ? '' : 'Upgrade Required',
        showAlert: true
      }
    }

    return {
      disabled: false,
      text: buttonText,
      showAlert: false
    }
  }

  const buttonState = getButtonState()

  return (
    <>
      <Button
        onClick={handleCreateQuote}
        variant={variant}
        size={size}
        className={`${className} ${
          buttonState.showAlert 
            ? 'bg-amber-600 hover:bg-amber-700' 
            : 'bg-forest-green hover:opacity-90'
        } text-white font-bold`}
        disabled={buttonState.disabled}
      >
        <Plus className="w-4 h-4 mr-2" />
        {buttonState.text}
        {buttonState.showAlert && <AlertCircle className="w-4 h-4 ml-2" />}
      </Button>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          feature="Quote Creation"
          title="Quote Limit Reached"
          description={
            limit 
              ? `You've used ${current} of ${limit} quotes this month. Upgrade to Pro for unlimited quotes.`
              : "Upgrade to Pro to create unlimited quotes and access all premium features."
          }
          modal={true}
          open={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          benefits={[
            'Unlimited quotes per month',
            'Professional PDF exports',
            'Custom branding and logos',
            'Advanced analytics dashboard',
            'Priority customer support'
          ]}
        />
      )}
    </>
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
