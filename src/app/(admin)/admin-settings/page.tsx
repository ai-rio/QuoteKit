"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Save, RefreshCw, Settings, Database, BarChart3, Mail } from "lucide-react"

interface PostHogConfig {
  project_api_key: string
  host: string
  project_id: string
  personal_api_key: string
}

interface ConfigStatus {
  isConfigured: boolean
  isConnected: boolean
  lastChecked: string | null
}

export default function AdminSettingsPage() {
  const [posthogConfig, setPosthogConfig] = useState<PostHogConfig>({
    project_api_key: '',
    host: 'https://us.posthog.com',
    project_id: '',
    personal_api_key: ''
  })
  
  const [resendConfig, setResendConfig] = useState({
    api_key: '',
    from_email: '',
    from_name: ''
  })
  
  const [posthogStatus, setPosthogStatus] = useState<ConfigStatus>({
    isConfigured: false,
    isConnected: false,
    lastChecked: null
  })
  
  const [resendStatus, setResendStatus] = useState<ConfigStatus>({
    isConfigured: false,
    isConnected: false,
    lastChecked: null
  })
  
  const [loading, setLoading] = useState({ posthog: false, resend: false })
  const [testing, setTesting] = useState({ posthog: false, resend: false })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; service?: string } | null>(null)

  useEffect(() => {
    fetchCurrentConfigs()
  }, [])

  const fetchCurrentConfigs = async () => {
    try {
      // Fetch PostHog config
      const posthogResponse = await fetch('/api/admin/posthog-config')
      if (posthogResponse.ok) {
        const posthogData = await posthogResponse.json()
        setPosthogConfig(posthogData.config)
        setPosthogStatus(posthogData.status)
      }

      // Fetch Resend config
      const resendResponse = await fetch('/api/admin/resend-config')
      if (resendResponse.ok) {
        const resendData = await resendResponse.json()
        setResendConfig(resendData.config)
        setResendStatus(resendData.status)
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error)
    }
  }

  const testPosthogConnection = async () => {
    setTesting(prev => ({ ...prev, posthog: true }))
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/posthog-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(posthogConfig)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'PostHog connection successful!', service: 'posthog' })
        setPosthogStatus(prev => ({ ...prev, isConnected: true, lastChecked: new Date().toISOString() }))
      } else {
        setMessage({ type: 'error', text: result.error || 'PostHog connection failed', service: 'posthog' })
        setPosthogStatus(prev => ({ ...prev, isConnected: false, lastChecked: new Date().toISOString() }))
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test PostHog connection', service: 'posthog' })
    } finally {
      setTesting(prev => ({ ...prev, posthog: false }))
    }
  }

  const testResendConnection = async () => {
    setTesting(prev => ({ ...prev, resend: true }))
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/resend-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resendConfig)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Resend connection successful!', service: 'resend' })
        setResendStatus(prev => ({ ...prev, isConnected: true, lastChecked: new Date().toISOString() }))
      } else {
        setMessage({ type: 'error', text: result.error || 'Resend connection failed', service: 'resend' })
        setResendStatus(prev => ({ ...prev, isConnected: false, lastChecked: new Date().toISOString() }))
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test Resend connection', service: 'resend' })
    } finally {
      setTesting(prev => ({ ...prev, resend: false }))
    }
  }

  const savePosthogConfig = async () => {
    setLoading(prev => ({ ...prev, posthog: true }))
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/posthog-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(posthogConfig)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'PostHog configuration saved successfully!', service: 'posthog' })
        setPosthogStatus(prev => ({ ...prev, isConfigured: true }))
        setTimeout(() => testPosthogConnection(), 1000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save PostHog configuration', service: 'posthog' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save PostHog configuration', service: 'posthog' })
    } finally {
      setLoading(prev => ({ ...prev, posthog: false }))
    }
  }

  const saveResendConfig = async () => {
    setLoading(prev => ({ ...prev, resend: true }))
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/resend-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resendConfig)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Resend configuration saved successfully!', service: 'resend' })
        setResendStatus(prev => ({ ...prev, isConfigured: true }))
        setTimeout(() => testResendConnection(), 1000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save Resend configuration', service: 'resend' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save Resend configuration', service: 'resend' })
    } finally {
      setLoading(prev => ({ ...prev, resend: false }))
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-quote-header text-charcoal font-bold">
          Admin Settings
        </h1>
        <p className="text-charcoal/70">
          Configure third-party integrations and system settings
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* PostHog Status Cards */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {posthogStatus.isConfigured ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium text-charcoal">PostHog Config</p>
                <Badge variant={posthogStatus.isConfigured ? "default" : "secondary"}>
                  {posthogStatus.isConfigured ? "Configured" : "Not Configured"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {posthogStatus.isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-charcoal">PostHog Connection</p>
                <Badge variant={posthogStatus.isConnected ? "default" : "destructive"}>
                  {posthogStatus.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resend Status Cards */}
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {resendStatus.isConfigured ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium text-charcoal">Resend Config</p>
                <Badge variant={resendStatus.isConfigured ? "default" : "secondary"}>
                  {resendStatus.isConfigured ? "Configured" : "Not Configured"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {resendStatus.isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-charcoal">Resend Connection</p>
                <Badge variant={resendStatus.isConnected ? "default" : "destructive"}>
                  {resendStatus.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PostHog Configuration */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-section-title text-charcoal">
            <BarChart3 className="w-5 h-5" />
            PostHog Analytics Configuration
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Configure your PostHog analytics integration for user tracking and behavioral analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PostHog Alert Message */}
          {message && (!message.service || message.service === 'posthog') && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="posthog_project_api_key" className="text-label text-charcoal font-medium">
                Project API Key *
              </Label>
              <Input
                id="posthog_project_api_key"
                type="password"
                placeholder="phc_..."
                value={posthogConfig.project_api_key}
                onChange={(e) => setPosthogConfig(prev => ({ ...prev, project_api_key: e.target.value }))}
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posthog_personal_api_key" className="text-label text-charcoal font-medium">
                Personal API Key *
              </Label>
              <Input
                id="posthog_personal_api_key"
                type="password"
                placeholder="phx_..."
                value={posthogConfig.personal_api_key}
                onChange={(e) => setPosthogConfig(prev => ({ ...prev, personal_api_key: e.target.value }))}
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posthog_host" className="text-label text-charcoal font-medium">
                PostHog Host
              </Label>
              <Input
                id="posthog_host"
                placeholder="https://us.posthog.com"
                value={posthogConfig.host}
                onChange={(e) => setPosthogConfig(prev => ({ ...prev, host: e.target.value }))}
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="posthog_project_id" className="text-label text-charcoal font-medium">
                Project ID
              </Label>
              <Input
                id="posthog_project_id"
                placeholder="12345"
                value={posthogConfig.project_id}
                onChange={(e) => setPosthogConfig(prev => ({ ...prev, project_id: e.target.value }))}
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={testPosthogConnection}
              disabled={testing.posthog || !posthogConfig.project_api_key || !posthogConfig.personal_api_key}
              variant="outline"
              className="border-stone-gray text-charcoal hover:bg-stone-gray/20"
            >
              {testing.posthog ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Test PostHog Connection
            </Button>
            
            <Button
              onClick={savePosthogConfig}
              disabled={loading.posthog || !posthogConfig.project_api_key || !posthogConfig.personal_api_key}
              className="bg-forest-green text-white hover:opacity-90"
            >
              {loading.posthog ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save PostHog Config
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resend Configuration */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-section-title text-charcoal">
            <Mail className="w-5 h-5" />
            Resend Email Configuration
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Configure your Resend email service for transactional emails and notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resend Alert Message */}
          {message && message.service === 'resend' && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="resend_api_key" className="text-label text-charcoal font-medium">
                Resend API Key *
              </Label>
              <Input
                id="resend_api_key"
                type="password"
                placeholder="re_..."
                value={resendConfig.api_key}
                onChange={(e) => setResendConfig(prev => ({ ...prev, api_key: e.target.value }))}
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green"
              />
              <p className="text-xs text-charcoal/60">
                Found in your Resend dashboard under API Keys
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resend_from_email" className="text-label text-charcoal font-medium">
                From Email Address *
              </Label>
              <Input
                id="resend_from_email"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={resendConfig.from_email}
                onChange={(e) => setResendConfig(prev => ({ ...prev, from_email: e.target.value }))}
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green"
              />
              <p className="text-xs text-charcoal/60">
                Must be from a verified domain in Resend
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resend_from_name" className="text-label text-charcoal font-medium">
                From Name
              </Label>
              <Input
                id="resend_from_name"
                placeholder="LawnQuote Support"
                value={resendConfig.from_name}
                onChange={(e) => setResendConfig(prev => ({ ...prev, from_name: e.target.value }))}
                className="bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green"
              />
              <p className="text-xs text-charcoal/60">
                Display name for outgoing emails
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={testResendConnection}
              disabled={testing.resend || !resendConfig.api_key || !resendConfig.from_email}
              variant="outline"
              className="border-stone-gray text-charcoal hover:bg-stone-gray/20"
            >
              {testing.resend ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Test Resend Connection
            </Button>
            
            <Button
              onClick={saveResendConfig}
              disabled={loading.resend || !resendConfig.api_key || !resendConfig.from_email}
              className="bg-forest-green text-white hover:opacity-90"
            >
              {loading.resend ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Resend Config
            </Button>
          </div>

          {/* Resend Help Text */}
          <div className="bg-light-concrete p-4 rounded-lg">
            <h4 className="font-medium text-charcoal mb-2">Resend Setup Instructions:</h4>
            <ol className="text-sm text-charcoal/70 space-y-1 list-decimal list-inside">
              <li>Log into your Resend dashboard</li>
              <li>Go to API Keys and create a new API key</li>
              <li>Verify your domain in the Domains section</li>
              <li>Enter your API key and verified email address above</li>
              <li>Test the connection to ensure email delivery works</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}