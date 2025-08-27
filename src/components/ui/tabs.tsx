"use client"

import * as TabsPrimitive from "@radix-ui/react-tabs"
import * as React from "react"

import { cn } from "@/utils/cn"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-stone-gray/20 text-charcoal inline-flex h-10 w-fit items-center justify-center rounded-lg p-[3px] border border-stone-gray/30",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-paper-white data-[state=active]:text-forest-green data-[state=active]:border-forest-green/20 focus-visible:border-forest-green focus-visible:ring-forest-green/20 focus-visible:outline-forest-green text-charcoal hover:text-forest-green inline-flex h-[calc(100%-3px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap transition-[color,box-shadow,background-color] focus-visible:ring-[3px] focus-visible:outline-2 focus-visible:outline-offset-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none focus-visible:ring-2 focus-visible:ring-forest-green focus-visible:ring-offset-2", className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent,TabsList, TabsTrigger }
