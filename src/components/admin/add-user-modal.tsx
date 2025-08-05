'use client'

import { Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'

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
import { useToast } from '@/components/ui/use-toast'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: () => void
}

interface CreateUserData {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'user'
}

export function AddUserModal({ isOpen, onClose, onUserCreated }: AddUserModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    full_name: '',
    role: 'user'
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing required fields",
        description: "Email and password are required",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      toast({
        title: "User created successfully",
        description: `${formData.email} has been created and invited.`,
      })

      // Reset form
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'user'
      })

      onUserCreated()
      onClose()
    } catch (error) {
      toast({
        title: "Error creating user",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-paper-white border-stone-gray max-w-md">
        <DialogHeader>
          <DialogTitle className="text-charcoal text-section-title flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New User
          </DialogTitle>
          <DialogDescription className="text-charcoal/70">
            Create a new user account and assign permissions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="grid gap-3">
            <Label htmlFor="email" className="text-label text-charcoal font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="user@company.com"
              required
            />
          </div>

          {/* Password Field */}
          <div className="grid gap-3">
            <Label htmlFor="password" className="text-label text-charcoal font-medium">
              Temporary Password *
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          {/* Full Name Field */}
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
              placeholder="John Doe"
            />
          </div>

          {/* Role Selection */}
          <div className="grid gap-3">
            <Label htmlFor="role" className="text-label text-charcoal font-medium">
              User Role
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: 'admin' | 'user') => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-paper-white border-stone-gray">
                <SelectItem value="user" className="text-charcoal">
                  Regular User
                </SelectItem>
                <SelectItem value="admin" className="text-charcoal">
                  Administrator
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-paper-white text-charcoal hover:bg-stone-gray/20 border border-stone-gray"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-forest-green text-white hover:opacity-90 active:opacity-80 font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}