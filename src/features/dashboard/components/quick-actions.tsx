import { Crown,FileText, Package, Plus, Settings } from "lucide-react"
import Link from "next/link"

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
    case 'file-text':
      return FileText
    case 'crown':
      return Crown
    default:
      return Plus
  }
}

function getColorClasses(color: string) {
  switch (color) {
    case 'forest-green':
      return 'bg-forest-green hover:opacity-90 text-white'
    case 'equipment-yellow':
      return 'bg-equipment-yellow hover:bg-equipment-yellow/90 text-charcoal hover:text-charcoal'
    case 'stone-gray':
      return 'bg-stone-gray hover:bg-stone-gray/90 text-charcoal'
    default:
      return 'bg-forest-green hover:opacity-90 text-white'
  }
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {actions.map((action) => {
        const Icon = getIcon(action.icon)
        const colorClasses = getColorClasses(action.color)
        
        return (
          <Card key={action.href} className="group hover:shadow-lg transition-shadow bg-paper-white border-stone-gray">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-lg font-bold text-charcoal">{action.title}</CardTitle>
              <CardDescription className="text-sm text-charcoal/70">
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