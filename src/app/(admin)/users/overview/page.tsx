'use client'

import { 
  Activity,
  Calendar,
  Download,
  Loader2,
  MoreHorizontal,
  Search,
  Settings,
  UserPlus
} from 'lucide-react'
import { useState } from 'react'

import { AddUserModal } from '@/components/admin/add-user-modal'
import { Pagination } from '@/components/admin/pagination'
import { UserEditModal } from '@/components/admin/user-edit-modal'
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
import { type AdminUser,useAdminUsers } from "@/hooks/use-admin-users"

// Mock user data - will be replaced with real data from Supabase + PostHog


export default function UsersOverview() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { users, loading, error, pagination, refreshUsers, updateUserRole } = useAdminUsers(currentPage, 20)

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Calculate summary stats
  const totalUsers = pagination?.total || 0
  const activeUsers = users.filter(u => u.status === 'active').length
  const totalQuotes = users.reduce((sum, user) => sum + (user.quote_count || 0), 0)
  const totalRevenue = users.reduce((sum, user) => sum + (user.total_revenue || 0), 0)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    const success = await updateUserRole(userId, newRole)
    if (success) {
      // Show success message or notification
      console.log('Role updated successfully')
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setSelectedUser(null)
  }

  const handleUserUpdated = () => {
    refreshUsers()
  }

  const handleAddUser = () => {
    setIsAddModalOpen(true)
  }

  const handleAddModalClose = () => {
    setIsAddModalOpen(false)
  }

  const handleUserCreated = () => {
    refreshUsers()
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/admin/users/export')
      
      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      // Get the CSV content
      const csvContent = await response.text()
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error exporting data:', error)
      // Could add toast notification here for error feedback
    }
  }

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
          <Button 
            onClick={handleExportData}
            className="bg-equipment-yellow border-equipment-yellow text-charcoal hover:bg-equipment-yellow/90 font-bold px-6 py-3 rounded-lg transition-all duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button 
            onClick={handleAddUser}
            className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="bg-paper-white border-red-300 shadow-sm">
          <CardContent className="p-4">
            <div className="text-red-600 text-sm">
              Error: {error}
              <Button 
                onClick={refreshUsers}
                size="sm" 
                variant="outline" 
                className="ml-2 text-xs"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUsers}
            </div>
            <p className="text-xs text-charcoal/70">
              Platform users
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
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : activeUsers}
            </div>
            <p className="text-xs text-charcoal/70">
              {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% active rate
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
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalQuotes}
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
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `$${totalRevenue.toLocaleString()}`}
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
                  placeholder="Search by email, name, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-charcoal/60" />
              <span className="ml-2 text-charcoal/70">Loading users...</span>
            </div>
          ) : (
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
              {filteredUsers.length === 0 ? (
                <div className="px-6 py-8 text-center text-charcoal/70">
                  {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-stone-gray/20 border-b border-stone-gray/50 last:border-b-0">
                    <div className="col-span-3">
                      <div className="text-charcoal font-medium text-sm">
                        {user.email}
                      </div>
                      <div className="text-charcoal/70 text-xs">
                        {user.full_name || user.company_name}
                      </div>
                      {user.role === 'admin' && (
                        <Badge className="mt-1 text-xs bg-equipment-yellow text-charcoal">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="font-mono text-charcoal font-semibold">
                        {user.quote_count || 0}
                      </div>
                      <div className="text-charcoal/70 text-xs">
                        {user.accepted_quotes || 0} accepted
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="font-mono text-charcoal font-semibold">
                        ${(user.total_revenue || 0).toLocaleString()}
                      </div>
                      <div className="text-charcoal/70 text-xs">
                        {(user.acceptance_rate || 0).toFixed(1)}% rate
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-3 w-3 text-charcoal/70" />
                        <span className="text-charcoal/70 text-xs">
                          {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
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
                          onClick={() => handleEditUser(user)}
                          className="bg-forest-green text-paper-white hover:bg-forest-green/90 font-bold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
        
        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
            />
          </div>
        )}
      </Card>

      {/* User Edit Modal */}
      <UserEditModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onUserUpdated={handleUserUpdated}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        onUserCreated={handleUserCreated}
      />
    </div>
  )
}