import { 
  AlertTriangle,
  Database,
  Download,
  Mail, 
  Settings,
  Trash2,
  Upload,
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

export default function BulkActions() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-quote-header text-charcoal font-bold">
          Bulk User Actions
        </h1>
        <p className="text-charcoal/70">
          Perform bulk operations on users across the platform
        </p>
      </div>

      {/* Warning Alert */}
      <Card className="bg-paper-white border-stone-gray shadow-sm border-l-4 border-l-equipment-yellow">
        <CardContent className="flex items-center p-4">
          <AlertTriangle className="h-5 w-5 text-equipment-yellow mr-3" />
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal">
              Bulk Operations Warning
            </p>
            <p className="text-xs text-charcoal/70">
              These operations affect multiple users. Please use with caution.
            </p>
          </div>
          <Badge variant="outline" className="text-equipment-yellow border-equipment-yellow">
            Admin Only
          </Badge>
        </CardContent>
      </Card>

      {/* Bulk Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Export */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-section-title text-charcoal flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Data Export
            </CardTitle>
            <CardDescription className="text-charcoal/70">
              Export user data and analytics for reporting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="bg-forest-green text-white hover:opacity-90 font-bold w-full"
                disabled
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Users (CSV)
              </Button>
              <Button 
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold w-full"
                disabled
              >
                <Database className="w-4 h-4 mr-2" />
                Export Analytics Data
              </Button>
            </div>
            <p className="text-xs text-charcoal/60">
              Coming in Phase 3 of admin panel development
            </p>
          </CardContent>
        </Card>

        {/* Email Campaigns */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-section-title text-charcoal flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Email Campaigns
            </CardTitle>
            <CardDescription className="text-charcoal/70">
              Send bulk emails to users or segments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="bg-forest-green text-white hover:opacity-90 font-bold w-full"
                disabled
              >
                <Mail className="w-4 h-4 mr-2" />
                Create Email Campaign
              </Button>
              <Button 
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold w-full"
                disabled
              >
                <Users className="w-4 h-4 mr-2" />
                Target User Segments
              </Button>
            </div>
            <p className="text-xs text-charcoal/60">
              Email system integration coming soon
            </p>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-section-title text-charcoal flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              User Management
            </CardTitle>
            <CardDescription className="text-charcoal/70">
              Bulk user operations and role management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="bg-forest-green text-white hover:opacity-90 font-bold w-full"
                disabled
              >
                <Users className="w-4 h-4 mr-2" />
                Bulk Role Assignment
              </Button>
              <Button 
                variant="outline"
                className="border-stone-gray text-charcoal hover:bg-stone-gray/20 w-full"
                disabled
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Bulk User Deactivation
              </Button>
            </div>
            <p className="text-xs text-charcoal/60">
              Advanced user management features in development
            </p>
          </CardContent>
        </Card>

        {/* Data Import */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-section-title text-charcoal flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Data Import
            </CardTitle>
            <CardDescription className="text-charcoal/70">
              Import user data and bulk operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="bg-forest-green text-white hover:opacity-90 font-bold w-full"
                disabled
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Users (CSV)
              </Button>
              <Button 
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold w-full"
                disabled
              >
                <Database className="w-4 h-4 mr-2" />
                Bulk Data Update
              </Button>
            </div>
            <p className="text-xs text-charcoal/60">
              Import functionality will be added in Phase 3
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-section-title text-charcoal">
            Development Roadmap
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Planned bulk operation features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-charcoal mb-2">Phase 2</h4>
              <ul className="text-sm text-charcoal/70 space-y-1">
                <li>• Basic CSV export functionality</li>
                <li>• Simple email campaign system</li>
                <li>• User status bulk updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-charcoal mb-2">Phase 3</h4>
              <ul className="text-sm text-charcoal/70 space-y-1">
                <li>• Advanced segmentation tools</li>
                <li>• Automated email workflows</li>
                <li>• Bulk data import/export</li>
                <li>• Custom role management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}