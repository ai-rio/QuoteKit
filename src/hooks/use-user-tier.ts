"use client"

import { useEffect, useState } from 'react'

import { useUser } from '@/hooks/use-user'
import { createSupabaseClientClient } from '@/libs/supabase/supabase-client-client'

export type UserTier = 'free' | 'pro' | 'enterprise'

interface UserTierInfo {
  tier: UserTier
  isLoading: boolean
  subscription: any | null
  canAccess: (feature: string) => boolean
}

export function useUserTier(): UserTierInfo {
  const { data: user } = useUser()
  const [tier, setTier] = useState<UserTier>('free')
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    async function fetchUserTier() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createSupabaseClientClient()
        
        // Get user's subscription with pricing info
        const { data: subscriptionData, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            stripe_prices!inner (
              *,
              stripe_products!inner (
                name,
                metadata
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error)
          setTier('free')
          setSubscription(null)
        } else if (subscriptionData) {
          setSubscription(subscriptionData)
          
          // Determine tier from product metadata
          const productName = subscriptionData.stripe_prices?.stripe_products?.name?.toLowerCase()
          const metadata = subscriptionData.stripe_prices?.stripe_products?.metadata || {}
          
          if (metadata.tier === 'enterprise' || productName?.includes('enterprise')) {
            setTier('enterprise')
          } else if (metadata.tier === 'pro' || productName?.includes('pro')) {
            setTier('pro')
          } else {
            setTier('free')
          }
        } else {
          // No active subscription = free tier
          setTier('free')
          setSubscription(null)
        }
      } catch (error) {
        console.error('Error determining user tier:', error)
        setTier('free')
        setSubscription(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserTier()
  }, [user?.id])

  // Function to check if user can access specific features
  const canAccess = (feature: string): boolean => {
    if (!subscription) return false

    const metadata = subscription?.stripe_prices?.stripe_products?.metadata || {}
    
    // Check specific feature access
    switch (feature) {
      case 'analytics_access':
        return metadata.analytics_access === 'true' || tier === 'pro' || tier === 'enterprise'
      case 'unlimited_quotes':
        return tier === 'pro' || tier === 'enterprise'
      case 'custom_branding':
        return tier === 'pro' || tier === 'enterprise'
      case 'priority_support':
        return tier === 'pro' || tier === 'enterprise'
      case 'advanced_exports':
        return tier === 'pro' || tier === 'enterprise'
      case 'team_collaboration':
        return tier === 'enterprise'
      case 'white_label':
        return tier === 'enterprise'
      default:
        return true // Basic features available to all
    }
  }

  return {
    tier,
    isLoading,
    subscription,
    canAccess
  }
}