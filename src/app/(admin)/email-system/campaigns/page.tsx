import { 
  BarChart3,
  Calendar,
  Eye,
  Mail, 
  Plus,
  Send, 
  Settings,
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

// Mock campaign data
const mockCampaigns = [
  {
    id: '1',
    name: 'Welcome New Users',
    status: 'active',
    recipients: 15,
    sent: 12,
    opened: 8,
    clicked: 3,
    created_at: '2024-01-15',
    last_sent: '2 hours ago'
  },
  {
    id: '2',
    name: 'Monthly Newsletter',
    status: 'draft',
    recipients: 42,
    sent: 0,
    opened: 0,
    clicked: 0,
    created_at: '2024-01-20',
    last_sent: null
  },
  {
    id: '3',
    name: 'Quote Follow-up',
    status: 'scheduled',
    recipients: 8,
    sent: 0,
    opened: 0,
    clicked: 0,
    created_at: '2024-01-18',
    last_sent: null
  }
]

export default function EmailCampaigns() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-quote-header text-charcoal font-bold">
            Email Campaigns
          </h1>
          <p className="text-charcoal/70">
            Create and manage email campaigns for your users
          </p>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
          <Button className="bg-forest-green text-white hover:opacity-90 font-bold">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Campaigns
            </CardTitle>
            <Mail className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {mockCampaigns.length}
            </div>
            <p className="text-xs text-charcoal/70">
              Active campaigns
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Emails Sent
            </CardTitle>
            <Send className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {mockCampaigns.reduce((sum, c) => sum + c.sent, 0)}
            </div>
            <p className="text-xs text-charcoal/70">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Open Rate
            </CardTitle>
            <Eye className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              67%
            </div>
            <p className="text-xs text-charcoal/70">
              Average open rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Recipients
            </CardTitle>
            <Users className="h-4 w-4 text-charcoal/70" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {mockCampaigns.reduce((sum, c) => sum + c.recipients, 0)}
            </div>
            <p className="text-xs text-charcoal/70">
              Total reach
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-section-title text-charcoal">
            Campaign Management
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Manage your email campaigns and track performance
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-paper-white border-stone-gray rounded-lg">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 font-bold text-sm text-charcoal/60 mb-2 px-6 py-3 bg-light-concrete border-b border-stone-gray">
              <div className="col-span-3">CAMPAIGN</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-2">RECIPIENTS</div>
              <div className="col-span-2">PERFORMANCE</div>
              <div className="col-span-2">LAST SENT</div>
              <div className="col-span-1">ACTIONS</div>
            </div>
            
            {/* Campaign Rows */}
            {mockCampaigns.map((campaign) => (
              <div key={campaign.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-stone-gray/20 border-b border-stone-gray/50 last:border-b-0">
                <div className="col-span-3">
                  <div className="text-charcoal font-medium text-sm">
                    {campaign.name}
                  </div>
                  <div className="text-charcoal/70 text-xs">
                    Created {new Date(campaign.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge 
                    variant={campaign.status === 'active' ? 'default' : 'secondary'}
                    className={
                      campaign.status === 'active' 
                        ? 'bg-forest-green text-white' 
                        : campaign.status === 'scheduled'
                        ? 'bg-equipment-yellow text-charcoal'
                        : 'bg-stone-gray text-charcoal'
                    }
                  >
                    {campaign.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <div className="font-mono text-charcoal font-semibold">
                    {campaign.recipients}
                  </div>
                  <div className="text-charcoal/70 text-xs">
                    users targeted
                  </div>
                </div>
                <div className="col-span-2">
                  {campaign.sent > 0 ? (
                    <div>
                      <div className="text-charcoal text-sm">
                        {campaign.opened}/{campaign.sent} opened
                      </div>
                      <div className="text-charcoal/70 text-xs">
                        {Math.round((campaign.opened / campaign.sent) * 100)}% open rate
                      </div>
                    </div>
                  ) : (
                    <div className="text-charcoal/70 text-sm">
                      Not sent yet
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <div className="text-charcoal/70 text-sm">
                    {campaign.last_sent || 'Never'}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="flex space-x-1">
                    <Button 
                      size="sm"
                      className="bg-forest-green text-white hover:opacity-90"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-stone-gray text-charcoal hover:bg-stone-gray/20"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-section-title text-charcoal">
            Quick Actions
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Common email campaign tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-forest-green text-white hover:opacity-90 font-bold h-12"
              disabled
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Welcome Series
            </Button>
            <Button 
              className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold h-12"
              disabled
            >
              <Users className="w-4 h-4 mr-2" />
              Segment Users
            </Button>
            <Button 
              className="bg-forest-green text-white hover:opacity-90 font-bold h-12"
              disabled
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </Button>
          </div>
          <p className="text-xs text-charcoal/60 mt-4">
            Email campaign functionality will be implemented in Phase 3 of development
          </p>
        </CardContent>
      </Card>
    </div>
  )
}