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
      <Alert className="border-[#2A3D2F] bg-[#2A3D2F]/5">
        <Lightbulb className="h-4 w-4 text-[#2A3D2F]" />
        <AlertTitle className="text-[#2A3D2F]">Welcome to LawnQuote, {userName}!</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-gray-600">
            Let&apos;s get your account set up. Complete these steps to start creating professional quotes:
          </p>
          <div className="space-y-2">
            <Progress value={progress.completionPercentage} className="w-full" />
            <div className="text-sm text-gray-500">
              {progress.completionPercentage}% complete
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                {progress.hasCompanySettings ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={progress.hasCompanySettings ? "text-green-600" : "text-gray-600"}>
                  Configure company settings
                </span>
              </div>
              <div className="flex items-center gap-2">
                {progress.hasItems ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={progress.hasItems ? "text-green-600" : "text-gray-600"}>
                  Add services and materials
                </span>
              </div>
              <div className="flex items-center gap-2">
                {progress.hasCreatedQuote ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={progress.hasCreatedQuote ? "text-green-600" : "text-gray-600"}>
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
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Welcome back, {userName}!</AlertTitle>
      <AlertDescription className="text-green-700">
        Your account is fully set up. Ready to create professional quotes for your clients.
      </AlertDescription>
    </Alert>
  )
}