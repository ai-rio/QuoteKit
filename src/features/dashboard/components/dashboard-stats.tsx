import { Activity, FileText, Package, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { DashboardStats } from "../types"

interface DashboardStatsProps {
  stats: DashboardStats
}

export function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Quotes",
      value: stats.totalQuotes,
      icon: FileText,
      color: "text-forest-green",
      bgColor: "bg-forest-green/10"
    },
    {
      title: "Items in Library",
      value: stats.totalItems,
      icon: Package,
      color: "text-equipment-yellow",
      bgColor: "bg-equipment-yellow/10"
    },
    {
      title: "Recent Activity",
      value: stats.recentActivity,
      icon: Activity,
      color: "text-forest-green",
      bgColor: "bg-forest-green/10"
    },
    {
      title: "Setup Progress",
      value: `${stats.setupProgress}%`,
      icon: TrendingUp,
      color: "text-forest-green",
      bgColor: "bg-forest-green/10"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="bg-paper-white border-stone-gray">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-charcoal">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}