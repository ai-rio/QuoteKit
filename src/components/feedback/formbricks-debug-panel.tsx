'use client'

import { AlertCircle, AlertTriangle, Bug,CheckCircle, Download, Play, RefreshCw, Zap } from 'lucide-react'
import React, { useEffect,useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FormbricksDebugManager } from '@/libs/formbricks/formbricks-manager'

interface DiagnosticResult {
  overallStatus: 'healthy' | 'warning' | 'error'
  results: Array<{
    category: string
    tests: Array<{
      name: string
      status: 'success' | 'warning' | 'error'
      message: string
      details?: any
    }>
  }>
  summary: {
    total: number
    passed: number
    warnings: number
    failed: number
  }
}

interface DebugResult {
  id: string
  timestamp: Date
  test: string
  status: 'success' | 'warning' | 'error'
  message: string
  details?: any
}

const statusIcons = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
  healthy: <CheckCircle className="h-4 w-4 text-green-500" />
}

const statusColors = {
  success: 'text-green-700 bg-green-50 border-green-200',
  warning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  error: 'text-red-700 bg-red-50 border-red-200',
  healthy: 'text-green-700 bg-green-50 border-green-200'
}

export function FormbricksDebugPanel() {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult | null>(null)
  const [debugResults, setDebugResults] = useState<DebugResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState('diagnostics')

  const debugManager = FormbricksDebugManager.getInstance()

  // Load existing debug results on mount
  useEffect(() => {
    setDebugResults(debugManager.getDebugResults())
  }, [debugManager])

  const runDiagnostics = async () => {
    setIsRunning(true)
    try {
      console.log('🔍 Running Formbricks diagnostics...')
      const results = await debugManager.runDiagnostics()
      setDiagnosticResults(results)
      setDebugResults(debugManager.getDebugResults())
    } catch (error) {
      console.error('Failed to run diagnostics:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const triggerTestEvent = async (eventName: string, properties?: Record<string, any>) => {
    try {
      const result = debugManager.triggerTestEvent(eventName, properties)
      setDebugResults(debugManager.getDebugResults())
      return result
    } catch (error) {
      console.error('Failed to trigger test event:', error)
    }
  }

  const testAllWidgets = async () => {
    setIsRunning(true)
    try {
      await debugManager.testAllWidgetOptions()
      setDebugResults(debugManager.getDebugResults())
    } catch (error) {
      console.error('Failed to test all widgets:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const exportDebugData = () => {
    const data = debugManager.exportDebugData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `formbricks-debug-${new Date().toISOString().slice(0, 19)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearResults = () => {
    debugManager.clearDebugResults()
    setDebugResults([])
    setDiagnosticResults(null)
  }

  const getStatusBadge = (status: 'success' | 'warning' | 'error') => {
    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return (
      <Badge variant="outline" className={colors[status]}>
        {statusIcons[status]}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bug className="h-6 w-6 text-blue-600" />
            Formbricks Debug Console
          </h2>
          <p className="text-muted-foreground">
            Comprehensive testing and debugging tools for Formbricks integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run Diagnostics
          </Button>
          <Button variant="outline" onClick={exportDebugData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" onClick={clearResults}>
            Clear Results
          </Button>
        </div>
      </div>

      {diagnosticResults && (
        <Alert className={`border-2 ${statusColors[diagnosticResults.overallStatus]}`}>
          <div className="flex items-center gap-2">
            {statusIcons[diagnosticResults.overallStatus]}
            <AlertTitle>
              System Status: {diagnosticResults.overallStatus === 'healthy' ? 'Healthy' : 
                            diagnosticResults.overallStatus === 'warning' ? 'Warning' : 'Error'}
            </AlertTitle>
          </div>
          <AlertDescription className="mt-2">
            <div className="flex items-center gap-4 text-sm">
              <span>✅ {diagnosticResults.summary.passed} Passed</span>
              {diagnosticResults.summary.warnings > 0 && (
                <span>⚠️ {diagnosticResults.summary.warnings} Warnings</span>
              )}
              {diagnosticResults.summary.failed > 0 && (
                <span>❌ {diagnosticResults.summary.failed} Failed</span>
              )}
              <span className="text-muted-foreground">
                Total: {diagnosticResults.summary.total} tests
              </span>
            </div>
            {diagnosticResults.summary.total > 0 && (
              <Progress 
                value={(diagnosticResults.summary.passed / diagnosticResults.summary.total) * 100}
                className="mt-2 h-2"
              />
            )}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="testing">Event Testing</TabsTrigger>
          <TabsTrigger value="widgets">Widget Testing</TabsTrigger>
          <TabsTrigger value="logs">Debug Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="space-y-4">
          {diagnosticResults ? (
            <div className="space-y-4">
              {diagnosticResults.results.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                    <CardDescription>
                      {category.tests.filter(t => t.status === 'success').length}/{category.tests.length} tests passed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {category.tests.map((test, testIndex) => (
                      <div key={testIndex} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {statusIcons[test.status]}
                            <span className="font-medium">{test.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{test.message}</p>
                          {test.details && process.env.NODE_ENV === 'development' && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer">
                                View Details
                              </summary>
                              <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                                {JSON.stringify(test.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(test.status)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Bug className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No diagnostics run yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Click &quot;Run Diagnostics&quot; to test your Formbricks integration
                </p>
                <Button onClick={runDiagnostics} disabled={isRunning}>
                  {isRunning ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  Run Diagnostics
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Common Events</CardTitle>
                <CardDescription>Test standard application events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => triggerTestEvent('page_view', { page: '/debug', debug: true })}
                >
                  Trigger Page View
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => triggerTestEvent('feature_used', { feature: 'formbricks_debug' })}
                >
                  Trigger Feature Used
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => triggerTestEvent('user_action', { action: 'debug_test', source: 'debug_panel' })}
                >
                  Trigger User Action
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Survey Triggers</CardTitle>
                <CardDescription>Test survey-specific events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => triggerTestEvent('quote_created', { quoteId: 'debug-quote-123' })}
                >
                  Trigger Quote Created
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => triggerTestEvent('dashboard_view', { section: 'main' })}
                >
                  Trigger Dashboard View
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => triggerTestEvent('upgrade_abandoned', { reason: 'debug_test' })}
                >
                  Trigger Upgrade Abandoned
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="widgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Widget Feedback Testing
              </CardTitle>
              <CardDescription>
                Test all feedback widget options programmatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testAllWidgets} 
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Test All Widget Options
              </Button>
              
              <Separator className="my-4" />
              
              <div className="grid gap-2 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => triggerTestEvent('quote_created', { quoteId: 'widget-test-1' })}
                >
                  Post Quote Survey
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => triggerTestEvent('dashboard_view', { section: 'satisfaction' })}
                >
                  Satisfaction Survey
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => triggerTestEvent('feature_used', { feature: 'item_library' })}
                >
                  Feature Value Survey
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => triggerTestEvent('exit_intent', { page: '/debug' })}
                >
                  Exit Intent Survey
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Debug Activity Log</CardTitle>
              <CardDescription>
                Recent debug activities and test results ({debugResults.length} entries)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {debugResults.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {debugResults.slice().reverse().map((result) => (
                    <div key={result.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <div className="mt-0.5">{statusIcons[result.status]}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{result.test}</span>
                          <span className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                        {result.details && process.env.NODE_ENV === 'development' && (
                          <details className="mt-1">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              Details
                            </summary>
                            <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto max-w-full">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No debug activities yet</p>
                  <p className="text-sm">Run diagnostics or trigger events to see logs here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FormbricksDebugPanel