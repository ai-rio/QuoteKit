import Link from "next/link"
import { Package, Plus, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { QuickAction } from "../types"

interface QuickActionsProps {
  actions: QuickAction[]
}

function getIcon(iconName: string) {
  switch (iconName) {
    case 'plus':
      return Plus
    case 'package':
      return Package
    case 'settings':
      return Settings
    default:
      return Plus
  }
}

function getColorClasses(color: string) {
  switch (color) {
    case 'forest-green':
      return 'bg-[#2A3D2F] hover:bg-[#2A3D2F]/90 text-white'
    case 'equipment-yellow':
      return 'bg-[#F2B705] hover:bg-[#F2B705]/90 text-[#1C1C1C]'
    case 'stone-gray':
      return 'bg-[#D7D7D7] hover:bg-[#D7D7D7]/90 text-[#1C1C1C]'
    default:
      return 'bg-[#2A3D2F] hover:bg-[#2A3D2F]/90 text-white'
  }
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {actions.map((action) => {
        const Icon = getIcon(action.icon)
        const colorClasses = getColorClasses(action.color)
        
        return (
          <Card key={action.href} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription className="text-sm">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                asChild 
                className={`w-full ${colorClasses}`}
                size="lg"
              >
                <Link href={action.href}>
                  Get Started
                </Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}