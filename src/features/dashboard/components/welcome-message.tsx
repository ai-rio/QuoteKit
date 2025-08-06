'use client'

import { CheckCircle2, Lightbulb } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

import { UserProgress } from "../types"

interface WelcomeMessageProps {
  userName: string
  progress: UserProgress
}

export function WelcomeMessage({ userName, progress }: WelcomeMessageProps) {
  const isNewUser = progress.completionPercentage < 50

  if (isNewUser) {
    return (
      <Alert className="border-stone-gray/20 bg-paper-white">
        <Lightbulb className="h-4 w-4 text-charcoal" />
        <AlertTitle className="text-xl md:text-2xl font-bold text-charcoal">Welcome to LawnQuote, {userName}!</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-lg text-charcoal/70">
            Let&apos;s get your account set up. Complete these steps to start creating professional quotes:
          </p>
          <div className="space-y-2">
            <Progress value={progress.completionPercentage} className="w-full" />
            <div className="text-base text-charcoal/60">
              {progress.completionPercentage}% complete
            </div>
            <div className="space-y-1 text-base">
              <div className="flex items-center gap-2">
                {progress.hasCompanySettings ? (
                  <CheckCircle2 className="h-4 w-4 text-forest-green" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-stone-gray" />
                )}
                <span className={progress.hasCompanySettings ? "text-forest-green" : "text-charcoal/70"}>
                  Configure company settings
                </span>
              </div>
              <div className="flex items-center gap-2">
                {progress.hasItems ? (
                  <CheckCircle2 className="h-4 w-4 text-forest-green" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-stone-gray" />
                )}
                <span className={progress.hasItems ? "text-forest-green" : "text-charcoal/70"}>
                  Add services and materials
                </span>
              </div>
              <div className="flex items-center gap-2">
                {progress.hasCreatedQuote ? (
                  <CheckCircle2 className="h-4 w-4 text-forest-green" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-stone-gray" />
                )}
                <span className={progress.hasCreatedQuote ? "text-forest-green" : "text-charcoal/70"}>
                  Create your first quote
                </span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-stone-gray/20 bg-paper-white">
      <CheckCircle2 className="h-4 w-4 text-forest-green" />
      <AlertTitle className="text-xl md:text-2xl font-bold text-charcoal">Welcome back, {userName}!</AlertTitle>
      <AlertDescription className="text-lg text-charcoal/70">
        Your account is fully set up. Ready to create professional quotes for your clients.
      </AlertDescription>
    </Alert>
  )
}
