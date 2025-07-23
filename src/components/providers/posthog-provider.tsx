"use client"

import { useEffect } from "react"

import { useUser } from "@/hooks/use-user"
import { posthog } from "@/libs/posthog/posthog-client"

interface PostHogProviderProps {
  children: React.ReactNode
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const { data: user } = useUser()

  useEffect(() => {
    if (user) {
      // Identify the user in PostHog
      posthog.identify(user.id, {
        email: user.email,
        // Add any other user properties you want to track
      })
    }
  }, [user])

  return <>{children}</>
}