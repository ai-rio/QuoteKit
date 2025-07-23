"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/utils/cn"
import { Skeleton } from "./skeleton"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <Loader2 
      className={cn("animate-spin text-charcoal/60", sizeClasses[size], className)} 
    />
  )
}

interface LoadingButtonProps {
  children: React.ReactNode
  isLoading: boolean
  loadingText?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingButton({ 
  children, 
  isLoading, 
  loadingText, 
  size = "md",
  className 
}: LoadingButtonProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center", className)}>
        <Loader2 className={cn("animate-spin mr-2", sizeClasses[size])} />
        {loadingText || "Loading..."}
      </div>
    )
  }

  return <>{children}</>
}

interface PageLoadingProps {
  title?: string
  description?: string
  className?: string
}

export function PageLoading({ 
  title = "Loading...", 
  description,
  className 
}: PageLoadingProps) {
  return (
    <div className={cn("min-h-screen bg-light-concrete flex items-center justify-center", className)}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-lg font-medium text-charcoal mb-2">{title}</h2>
        {description && (
          <p className="text-charcoal/60 text-sm">{description}</p>
        )}
      </div>
    </div>
  )
}

interface CardLoadingProps {
  className?: string
}

export function CardLoading({ className }: CardLoadingProps) {
  return (
    <div className={cn("bg-paper-white border border-stone-gray rounded-lg p-4 space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}

interface TableLoadingProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableLoading({ rows = 5, columns = 4, className }: TableLoadingProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Table Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-5 w-full" />
        ))}
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`row-${rowIndex}-col-${colIndex}`} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface NavigationLoadingProps {
  className?: string
}

export function NavigationLoading({ className }: NavigationLoadingProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}