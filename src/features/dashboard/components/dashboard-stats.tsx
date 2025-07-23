import { Activity, CheckCircle, DollarSign, FileText, Package, Send, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { DashboardStats } from "../types"

interface DashboardStatsProps {
  stats: DashboardStats
}

export function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const statCards = [
    {
      title: "Total Quotes",
      value: stats.totalQuotes,
      icon: FileText,
      color: "text-forest-green",
      bgColor: "bg-forest-green/10"
    },
    {
      title: "Quotes Sent",
      value: stats.sentQuotes,
      icon: Send,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Quotes Accepted",
      value: stats.acceptedQuotes,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
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
      title: "Quote Templates",
      value: stats.totalTemplates,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
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