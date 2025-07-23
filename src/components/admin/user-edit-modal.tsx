'use client'

import { useState } from 'react'
import { Loader2, Settings, Shield, User, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import type { AdminUser } from '@/hooks/use-admin-users'

import { UserActivityTimeline } from './user-activity-timeline'

interface UserEditModalProps {
  user: AdminUser | null
  isOpen: boolean
  onClose: () => void
  onUserUpdated: () => void
}

interface UserUpdateData {
  full_name: string
  status: 'active' | 'inactive'
  role: 'admin' | 'user'
}

export function UserEditModal({ user, isOpen, onClose, onUserUpdated }: UserEditModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<UserUpdateData>({
    full_name: user?.full_name || '',
    status: user?.status || 'active',
    role: user?.role || 'user'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Update form data when user changes
  useState(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        status: user.status,
        role: user.role
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user')
      }

      toast({
        title: "User updated successfully",
        description: `${user.email} has been updated.`,
      })

      onUserUpdated()
      onClose()
    } catch (error) {
      toast({
        title: "Error updating user",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleChange = async (newRole: 'admin' | 'user') => {
    if (!user) return
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: newRole === 'admin' ? 'grant_admin' : 'revoke_admin',
          role: newRole
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user role')
      }

      setFormData(prev => ({ ...prev, role: newRole }))

      toast({
        title: "Role updated successfully",
        description: `${user.email} is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}.`,
      })

      onUserUpdated()
    } catch (error) {
      toast({
        title: "Error updating role",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!user) return
    
    const newStatus = formData.status === 'active' ? 'inactive' : 'active'
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user status')
      }

      setFormData(prev => ({ ...prev, status: newStatus }))

      toast({
        title: "Status updated successfully",
        description: `${user.email} is now ${newStatus}.`,
      })

      onUserUpdated()
    } catch (error) {
      toast({
        title: "Error updating status",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-paper-white border-stone-gray max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-charcoal text-section-title flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription className="text-charcoal/70">
            Manage user profile, permissions, and account status
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="text-charcoal">Profile & Settings</TabsTrigger>
            <TabsTrigger value="activity" className="text-charcoal">Activity Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Info Header */}
              <div className="bg-light-concrete p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{user.email}</p>
                    <p className="text-xs text-charcoal/70">
                      Member since {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge 
                    className={formData.status === 'active' 
                      ? 'bg-forest-green text-white' 
                      : 'bg-stone-gray text-charcoal'
                    }
                  >
                    {formData.status}
                  </Badge>
                </div>
              </div>

              {/* Full Name */}
              <div className="grid gap-3">
                <Label htmlFor="full_name" className="text-label text-charcoal font-medium">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
                  placeholder="Enter full name"
                />
              </div>

              {/* Role Management */}
              <div className="grid gap-3">
                <Label className="text-label text-charcoal font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  User Role
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.role === 'user' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRoleChange('user')}
                    disabled={isLoading}
                    className={
                      formData.role === 'user'
                        ? 'bg-forest-green text-white hover:opacity-90'
                        : 'border-stone-gray text-charcoal hover:bg-stone-gray/20'
                    }
                  >
                    <User className="h-4 w-4 mr-1" />
                    User
                  </Button>
                  <Button
                    type="button"
                    variant={formData.role === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRoleChange('admin')}
                    disabled={isLoading}
                    className={
                      formData.role === 'admin'
                        ? 'bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90'
                        : 'border-stone-gray text-charcoal hover:bg-stone-gray/20'
                    }
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                </div>
              </div>

              {/* Account Status */}
              <div className="grid gap-3">
                <Label className="text-label text-charcoal font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Account Status
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStatusToggle}
                  disabled={isLoading}
                  className={`border-stone-gray text-charcoal hover:bg-stone-gray/20 justify-start ${
                    formData.status === 'inactive' ? 'border-red-300 text-red-600' : ''
                  }`}
                >
                  {formData.status === 'active' ? 'Disable Account' : 'Enable Account'}
                </Button>
              </div>

              {/* User Statistics */}
              <div className="bg-light-concrete p-4 rounded-lg">
                <h4 className="text-sm font-medium text-charcoal mb-3">Account Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-charcoal/70">Total Quotes</p>
                    <p className="font-mono font-semibold text-charcoal">{user.quote_count}</p>
                  </div>
                  <div>
                    <p className="text-charcoal/70">Total Revenue</p>
                    <p className="font-mono font-semibold text-charcoal">${user.total_revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-charcoal/70">Accepted Quotes</p>
                    <p className="font-mono font-semibold text-charcoal">{user.accepted_quotes}</p>
                  </div>
                  <div>
                    <p className="text-charcoal/70">Acceptance Rate</p>
                    <p className="font-mono font-semibold text-charcoal">{user.acceptance_rate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-stone-gray">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="border-stone-gray text-charcoal hover:bg-stone-gray/20"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-forest-green text-white hover:opacity-90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            <UserActivityTimeline user={user} />
            <div className="flex justify-end pt-4 border-t border-stone-gray">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-stone-gray text-charcoal hover:bg-stone-gray/20"
              >
                Close
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}