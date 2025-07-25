"use client"

import {
  Activity,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react"

import { SystemMetricsCard } from "@/components/admin/system-metrics-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSystemStatus } from "@/hooks/use-user"

export default function AdminDashboard() {
  const { status: systemStatus, loading: statusLoading, error: statusError } = useSystemStatus()

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

      {/* Comprehensive System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 lg:gap-6">
        {/* System Health Status */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start space-x-2 lg:space-x-3">
              <Activity className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-1 ${
                statusLoading ? 'text-charcoal/60' :
                systemStatus?.overall.health === 'healthy' ? 'text-success-green' :
                systemStatus?.overall.health === 'warning' ? 'text-equipment-yellow' :
                'text-error-red'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal mb-2 text-sm lg:text-base truncate">System Health</p>
                <Badge 
                  variant={
                    statusLoading ? "archived" :
                    systemStatus?.overall.health === 'healthy' ? "active" :
                    systemStatus?.overall.health === 'warning' ? "archived" :
                    "destructive"
                  } 
                  size="sm" 
                  className="text-xs"
                >
                  {statusLoading ? 'Loading...' :
                   systemStatus?.overall.health === 'healthy' ? 'Operational' :
                   systemStatus?.overall.health === 'warning' ? 'Warning' :
                   'Critical'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PostHog Analytics Status */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start space-x-2 lg:space-x-3">
              <TrendingUp className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-1 ${
                statusLoading ? 'text-charcoal/60' :
                systemStatus?.posthog.connected ? 'text-success-green' :
                systemStatus?.posthog.configured ? 'text-equipment-yellow' :
                'text-equipment-yellow'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal mb-2 text-sm lg:text-base truncate">Analytics</p>
                <Badge 
                  variant={
                    statusLoading ? "archived" :
                    systemStatus?.posthog.connected ? "active" : "archived"
                  } 
                  size="sm" 
                  className="text-xs"
                >
                  {statusLoading ? 'Loading...' :
                   systemStatus?.posthog.connected ? 'Connected' :
                   systemStatus?.posthog.configured ? 'Configured' :
                   'Setup Required'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start space-x-2 lg:space-x-3">
              <DollarSign className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-1 ${
                statusLoading ? 'text-charcoal/60' :
                systemStatus?.database.connected ? 'text-success-green' : 'text-error-red'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal mb-2 text-sm lg:text-base truncate">Database</p>
                <Badge 
                  variant={
                    statusLoading ? "archived" :
                    systemStatus?.database.connected ? "active" : "destructive"
                  } 
                  size="sm" 
                  className="text-xs"
                >
                  {statusLoading ? 'Loading...' :
                   systemStatus?.database.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment System Status */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start space-x-2 lg:space-x-3">
              <Users className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-1 ${
                statusLoading ? 'text-charcoal/60' :
                systemStatus?.stripe.connected ? 'text-success-green' :
                systemStatus?.stripe.configured ? 'text-equipment-yellow' :
                'text-equipment-yellow'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal mb-2 text-sm lg:text-base truncate">Payments</p>
                <Badge 
                  variant={
                    statusLoading ? "archived" :
                    systemStatus?.stripe.connected ? "active" : "archived"
                  } 
                  size="sm" 
                  className="text-xs"
                >
                  {statusLoading ? 'Loading...' :
                   systemStatus?.stripe.connected ? 'Connected' :
                   systemStatus?.stripe.configured ? 'Configured' :
                   'Setup Required'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Service Status */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start space-x-2 lg:space-x-3">
              <Mail className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-1 ${
                statusLoading ? 'text-charcoal/60' :
                systemStatus?.resend.connected ? 'text-success-green' :
                systemStatus?.resend.configured ? 'text-equipment-yellow' :
                'text-equipment-yellow'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal mb-2 text-sm lg:text-base truncate">Email Service</p>
                <Badge 
                  variant={
                    statusLoading ? "archived" :
                    systemStatus?.resend.connected ? "active" : "archived"
                  } 
                  size="sm" 
                  className="text-xs"
                >
                  {statusLoading ? 'Loading...' :
                   systemStatus?.resend.connected ? 'Connected' :
                   systemStatus?.resend.configured ? 'Configured' :
                   'Setup Required'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Activity Status */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start space-x-2 lg:space-x-3">
              <FileText className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 mt-1 ${
                statusLoading ? 'text-charcoal/60' : 'text-success-green'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal mb-2 text-sm lg:text-base truncate">
                  {statusLoading ? 'User Activity' : `${systemStatus?.userActivity.totalUsers || 0} Users`}
                </p>
                <Badge variant="active" size="sm" className="text-xs">
                  {statusLoading ? 'Loading...' : 
                   `${systemStatus?.userActivity.activeUsers || 0} Active`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Alert - Enhanced */}
      {systemStatus && systemStatus.overall.issuesCount > 0 && (
        <Card className={`bg-paper-white border-stone-gray shadow-sm border-l-4 ${
          systemStatus.overall.health === 'critical' ? 'border-l-error-red' : 'border-l-equipment-yellow'
        }`}>
          <CardContent className="flex items-center p-4">
            <AlertTriangle className={`h-5 w-5 mr-3 ${
              systemStatus.overall.health === 'critical' ? 'text-error-red' : 'text-equipment-yellow'
            }`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-charcoal">
                System Configuration Status
              </p>
              <p className="text-xs text-charcoal/70">
                {systemStatus.overall.health === 'critical' 
                  ? 'Critical system components need immediate attention.' 
                  : 'Some integrations require configuration. Check Admin Settings to complete setup.'}
              </p>
            </div>
            <Badge variant="outline" className={
              systemStatus.overall.health === 'critical' 
                ? 'text-error-red border-error-red'
                : 'text-equipment-yellow border-equipment-yellow'
            }>
              {systemStatus.overall.issuesCount} Items Need Attention
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* System Health - All Good */}
      {systemStatus && systemStatus.overall.issuesCount === 0 && (
        <Card className="bg-paper-white border-stone-gray shadow-sm border-l-4 border-l-success-green">
          <CardContent className="flex items-center p-4">
            <Activity className="h-5 w-5 text-success-green mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-charcoal">
                All Systems Operational
              </p>
              <p className="text-xs text-charcoal/70">
                All system components are properly configured and functioning normally.
              </p>
            </div>
            <Badge variant="outline" className="text-success-green border-success-green">
              Healthy
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Real-Time System Metrics */}
      <SystemMetricsCard />

      {/* Enhanced Quick Actions */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-section-title text-charcoal">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Common administrative tasks and system management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/users/overview">
              <Button 
                className="bg-forest-green text-white hover:opacity-90 font-bold h-12 justify-start w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link href="/analytics/custom-queries">
              <Button 
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold h-12 justify-start w-full"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <Link href="/global-items">
              <Button 
                className="bg-forest-green text-white hover:opacity-90 font-bold h-12 justify-start w-full"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Global Items
              </Button>
            </Link>
            <Link href="/pricing-management">
              <Button 
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold h-12 justify-start w-full"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Pricing Management
              </Button>
            </Link>
            <Link href="/email-system/campaigns">
              <Button 
                className="bg-forest-green text-white hover:opacity-90 font-bold h-12 justify-start w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Campaigns
              </Button>
            </Link>
            <Link href="/admin-settings">
              <Button 
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold h-12 justify-start w-full"
              >
                <Activity className="w-4 h-4 mr-2" />
                System Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}