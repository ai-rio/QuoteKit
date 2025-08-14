import { CheckCircle, DollarSign, FileText, Package, Send } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useFormbricksTracking } from "@/hooks/use-formbricks-tracking"

import { DashboardStats } from "../types"

interface DashboardStatsProps {
  stats: DashboardStats
}

export function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  const { trackFeatureUsage } = useFormbricksTracking();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleStatCardClick = (statTitle: string, statValue: number | string) => {
    trackFeatureUsage('dashboard_stats', 'used', {
      statType: statTitle.toLowerCase().replace(/\s+/g, '_'),
      statValue,
    });
  };

  const statCards = [
    {
      title: "Total Quotes",
      value: stats.totalQuotes,
      icon: FileText,
      color: "text-forest-green"
    },
    {
      title: "Quotes Sent", 
      value: stats.sentQuotes,
      icon: Send,
      color: "text-info-blue"
    },
    {
      title: "Quotes Accepted",
      value: stats.acceptedQuotes,
      icon: CheckCircle,
      color: "text-success-green"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "text-forest-green"
    },
    {
      title: "Items in Library",
      value: stats.totalItems,
      icon: Package,
      color: "text-equipment-yellow"
    },
    {
      title: "Quote Templates",
      value: stats.totalTemplates,
      icon: FileText,
      color: "text-charcoal"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 lg:gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card 
            key={stat.title} 
            className="bg-paper-white border-stone-gray shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleStatCardClick(stat.title, stat.value)}
          >
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-start space-x-2 lg:space-x-3">
                <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${stat.color} flex-shrink-0 mt-1`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-charcoal mb-2 text-sm lg:text-base truncate">{stat.title}</p>
                  <p className="text-xl lg:text-2xl font-bold text-charcoal">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}