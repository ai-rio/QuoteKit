import { 
  Activity,
  Calendar,
  Download,
  MoreHorizontal,
  Search,
  Settings,
  UserPlus} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Mock user data - will be replaced with real data from Supabase + PostHog
const mockUsers = [
  {
    id: '1',
    email: 'john@lawncare.com',
    company_name: 'Green Lawn Services',
    quote_count: 12,
    total_revenue: 4250,
    last_active: '2 hours ago',
    created_at: '2024-01-15',
    status: 'active'
  },
  {
    id: '2', 
    email: 'sarah@yardpro.com',
    company_name: 'YardPro Solutions',
    quote_count: 8,
    total_revenue: 2840,
    last_active: '1 day ago', 
    created_at: '2024-02-03',
    status: 'active'
  },
  {
    id: '3',
    email: 'mike@grassmaster.net',
    company_name: 'GrassMaster LLC',
    quote_count: 23,
    total_revenue: 8750,
    last_active: '3 days ago',
    created_at: '2023-11-22',
    status: 'inactive' 
  },
  {
    id: '4',
    email: 'lisa@perfectlawns.com', 
    company_name: 'Perfect Lawns Inc',
    quote_count: 5,
    total_revenue: 1580,
    last_active: '1 week ago',
    created_at: '2024-03-10',
    status: 'active'
  },
]

export default function UsersOverview() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-quote-header text-charcoal font-bold">
            Users Overview
          </h1>
          <p className="text-charcoal/70">
            Manage users and view analytics across the platform
          </p>
        </div>
        <div className="flex space-x-3">
          <Button className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="bg-forest-green text-white hover:opacity-90 font-bold">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {mockUsers.length}
            </div>
            <p className="text-xs text-charcoal/70">
              +1 this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {mockUsers.filter(u => u.status === 'active').length}
            </div>
            <p className="text-xs text-charcoal/70">
              75% active rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              {mockUsers.reduce((sum, user) => sum + user.quote_count, 0)}
            </div>
            <p className="text-xs text-charcoal/70">
              Across all users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-charcoal">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-charcoal">
              ${mockUsers.reduce((sum, user) => sum + user.total_revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-charcoal/70">
              Platform revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-label text-charcoal font-medium">
                Search Users
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal/60 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by email or company name..."
                  className="pl-10 bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-section-title text-charcoal">
            User Management
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Manage users and view their analytics data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="bg-paper-white border-stone-gray rounded-lg">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 font-bold text-sm text-charcoal/60 mb-2 px-6 py-3 bg-light-concrete border-b border-stone-gray">
              <div className="col-span-3">USER</div>
              <div className="col-span-2">QUOTES</div>
              <div className="col-span-2">REVENUE</div>
              <div className="col-span-2">LAST ACTIVE</div>
              <div className="col-span-2">STATUS</div>
              <div className="col-span-1">ACTIONS</div>
            </div>
            
            {/* User Rows */}
            {mockUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-stone-gray/20 border-b border-stone-gray/50 last:border-b-0">
                <div className="col-span-3">
                  <div className="text-charcoal font-medium text-sm">
                    {user.email}
                  </div>
                  <div className="text-charcoal/70 text-xs">
                    {user.company_name}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono text-charcoal font-semibold">
                    {user.quote_count}
                  </div>
                  <div className="text-charcoal/70 text-xs">
                    quotes created
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono text-charcoal font-semibold">
                    ${user.total_revenue.toLocaleString()}
                  </div>
                  <div className="text-charcoal/70 text-xs">
                    total value
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-3 w-3 text-charcoal/70" />
                    <span className="text-charcoal/70 text-xs">
                      {user.last_active}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-3 w-3 text-charcoal/70" />
                    <span className="text-charcoal/70 text-xs">
                      Since {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <Badge 
                    variant={user.status === 'active' ? 'default' : 'secondary'}
                    className={user.status === 'active' 
                      ? 'bg-forest-green text-white' 
                      : 'bg-stone-gray text-charcoal'
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
                <div className="col-span-1">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm"
                      className="bg-forest-green text-white hover:opacity-90"
                    >
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-stone-gray text-charcoal hover:bg-stone-gray/20"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}