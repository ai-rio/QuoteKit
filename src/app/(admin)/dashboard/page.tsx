import { 
  Activity,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText, 
  Mail, 
  TrendingUp,
  Users} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"

// Placeholder data - will be replaced with real PostHog metrics
const mockMetrics = {
  totalUsers: 42,
  quotesCreated: 156,
  quotesAccepted: 89,
  totalRevenue: 24750,
  activeUsers30d: 28,
  emailsSent: 234,
  emailOpenRate: 68.5,
  conversionRate: 57.1,
}

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
              Ready for analytics integration - placeholder data shown below
            </p>
          </div>
          <Badge variant="outline" className="text-equipment-yellow border-equipment-yellow">
            Setup Required
          </Badge>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {mockMetrics.totalUsers}
            </div>
            <p className="text-xs text-charcoal/70">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Active Users (30d)
            </CardTitle>
            <Activity className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {mockMetrics.activeUsers30d}
            </div>
            <p className="text-xs text-charcoal/70">
              67% of total users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Quotes Created
            </CardTitle>
            <FileText className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {mockMetrics.quotesCreated}
            </div>
            <p className="text-xs text-charcoal/70">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              ${mockMetrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-charcoal/70">
              +8% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quote Conversion Metrics */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-section-title text-charcoal">
              Quote Performance
            </CardTitle>
            <CardDescription className="text-charcoal/70">
              Quote creation and conversion metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal/70">Quotes Created</span>
              <span className="font-mono text-charcoal font-semibold">
                {mockMetrics.quotesCreated}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal/70">Quotes Accepted</span>
              <span className="font-mono text-charcoal font-semibold">
                {mockMetrics.quotesAccepted}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal/70">Conversion Rate</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-charcoal font-semibold">
                  {mockMetrics.conversionRate}%
                </span>
                <div className="w-16 bg-stone-gray/30 rounded-full h-2">
                  <div 
                    className="bg-forest-green h-2 rounded-full" 
                    style={{ width: `${mockMetrics.conversionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Metrics */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-section-title text-charcoal">
              Email Performance
            </CardTitle>
            <CardDescription className="text-charcoal/70">
              Email delivery and engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal/70">Emails Sent</span>
              <span className="font-mono text-charcoal font-semibold">
                {mockMetrics.emailsSent}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal/70">Open Rate</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-charcoal font-semibold">
                  {mockMetrics.emailOpenRate}%
                </span>
                <div className="w-16 bg-stone-gray/30 rounded-full h-2">
                  <div 
                    className="bg-forest-green h-2 rounded-full" 
                    style={{ width: `${mockMetrics.emailOpenRate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                View Email System
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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