import { 
  Activity,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText, 
  Mail, 
  TrendingUp,
  Users} from "lucide-react"

import { SystemMetricsCard } from "@/components/admin/system-metrics-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-quote-header text-charcoal font-bold">
          Admin Dashboard
        </h1>
        <p className="text-charcoal/70">
          System overview and key metrics for QuoteKit
        </p>
      </div>

      {/* System Status Alert */}
      <Card className="bg-paper-white border-stone-gray shadow-sm border-l-4 border-l-equipment-yellow">
        <CardContent className="flex items-center p-4">
          <AlertTriangle className="h-5 w-5 text-equipment-yellow mr-3" />
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal">
              PostHog Integration Status
            </p>
            <p className="text-xs text-charcoal/70">
              Configure PostHog environment variables to see real analytics data
            </p>
          </div>
          <Badge variant="outline" className="text-equipment-yellow border-equipment-yellow">
            Setup Required
          </Badge>
        </CardContent>
      </Card>

      {/* Dynamic System Metrics */}
      <SystemMetricsCard />

      {/* Quick Actions */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-section-title text-charcoal">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-forest-green text-white hover:opacity-90 font-bold h-12"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            <Button 
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold h-12"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            <Button 
              className="bg-forest-green text-white hover:opacity-90 font-bold h-12"
            >
              <Calendar className="w-4 h-4 mr-2" />
              System Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}