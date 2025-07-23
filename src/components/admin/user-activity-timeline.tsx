'use client'

import { useEffect,useState } from 'react'
import { 
  Activity, 
  Calendar, 
  Clock, 
  FileText, 
  Loader2, 
  Mail, 
  MousePointer2,
  User
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { AdminUser } from '@/hooks/use-admin-users'

interface ActivityEvent {
  id: string
  type: 'login' | 'quote_created' | 'quote_sent' | 'quote_accepted' | 'profile_updated' | 'page_view'
  timestamp: string
  description: string
  metadata?: Record<string, any>
}

interface UserActivityTimelineProps {
  user: AdminUser
}

const activityIcons = {
  login: User,
  quote_created: FileText,
  quote_sent: Mail,
  quote_accepted: FileText,
  profile_updated: User,
  page_view: MousePointer2
}

const activityColors = {
  login: 'bg-forest-green text-white',
  quote_created: 'bg-equipment-yellow text-charcoal',
  quote_sent: 'bg-blue-600 text-white',
  quote_accepted: 'bg-green-600 text-white',
  profile_updated: 'bg-stone-gray text-charcoal',
  page_view: 'bg-stone-gray text-charcoal'
}

export function UserActivityTimeline({ user }: UserActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/users/${user.id}/activity`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch user activity')
        }

        if (result.success) {
          setActivities(result.data)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching user activity:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserActivity()
  }, [user.id])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  if (loading) {
    return (
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="text-section-title text-charcoal flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Recent user activity and events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="text-section-title text-charcoal flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-charcoal/70 mb-4">Failed to load activity timeline</p>
            <p className="text-sm text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              size="sm" 
              variant="outline"
              className="mt-4 border-stone-gray text-charcoal hover:bg-stone-gray/20"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-paper-white border-stone-gray shadow-sm">
      <CardHeader>
        <CardTitle className="text-section-title text-charcoal flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
        <CardDescription className="text-charcoal/70">
          Recent user activity and events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-charcoal/30 mx-auto mb-4" />
            <p className="text-charcoal/70">No activity found for this user</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || Activity
              const colorClass = activityColors[activity.type] || 'bg-stone-gray text-charcoal'
              
              return (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-stone-gray/30 last:border-b-0 last:pb-0">
                  <div className={`p-2 rounded-full ${colorClass} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-charcoal font-medium">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-charcoal/70">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                      <Badge variant="outline" className="text-xs border-stone-gray text-charcoal/70">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    {activity.metadata && (
                      <div className="mt-2 text-xs text-charcoal/60 bg-light-concrete p-2 rounded">
                        <pre className="whitespace-pre-wrap font-mono">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}