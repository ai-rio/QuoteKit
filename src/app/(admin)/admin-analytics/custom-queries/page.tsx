"use client"

import { 
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Edit2, 
  FileText,
  Loader2,
  Play, 
  Plus, 
  Save, 
  Trash2} from 'lucide-react'
import { useEffect,useState } from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

interface SavedQuery {
  id: string
  name: string
  description: string
  query: string
  created_at: string
  updated_at: string
}

interface QueryResult {
  query: string
  results: any[]
  columns: string[]
  query_duration_ms: number
  executed_at: string
  row_count: number
}

interface QueryTemplate {
  name: string
  description: string
  query: string
}

// Query templates for quick start
const queryTemplates: Record<string, QueryTemplate> = {
  userActivity: {
    name: "User Activity Analysis",
    description: "Analyze user activity patterns over time",
    query: `SELECT 
  toDate(timestamp) as date,
  count(*) as total_events,
  countDistinct(properties.user_id) as active_users,
  countIf(event = 'quote_created') as quotes_created
FROM events
WHERE timestamp >= now() - interval 30 day
  AND properties.user_id IS NOT NULL
GROUP BY date
ORDER BY date DESC
LIMIT 30`
  },
  quoteConversion: {
    name: "Quote Conversion Funnel",
    description: "Track quote conversion through each stage",
    query: `SELECT 
  event,
  count() as event_count,
  round(count() * 100.0 / (
    SELECT count() 
    FROM events 
    WHERE event = 'quote_created' 
    AND timestamp >= now() - interval 30 day
  ), 2) as conversion_percentage
FROM events
WHERE event IN ('quote_created', 'quote_sent', 'quote_accepted')
  AND timestamp >= now() - interval 30 day
GROUP BY event
ORDER BY event_count DESC`
  },
  revenue: {
    name: "Revenue Analysis",
    description: "Analyze revenue trends and patterns",
    query: `SELECT 
  toDate(timestamp) as date,
  sum(properties.quote_value) as daily_revenue,
  count() as quotes_count,
  avg(properties.quote_value) as avg_quote_value
FROM events
WHERE event = 'quote_accepted'
  AND timestamp >= now() - interval 30 day
  AND properties.quote_value > 0
GROUP BY date
ORDER BY date DESC
LIMIT 30`
  }
}

export default function CustomQueriesPage() {
  const [currentQuery, setCurrentQuery] = useState('')
  const [queryName, setQueryName] = useState('')
  const [queryDescription, setQueryDescription] = useState('')
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null)

  // Load saved queries on component mount
  useEffect(() => {
    fetchSavedQueries()
  }, [])

  const fetchSavedQueries = async () => {
    try {
      const response = await fetch('/api/admin/custom-queries')
      const result = await response.json()
      
      if (result.success) {
        setSavedQueries(result.data)
      }
    } catch (error) {
      console.error('Error fetching saved queries:', error)
    }
  }

  const executeQuery = async () => {
    if (!currentQuery.trim()) {
      setError('Please enter a query to execute')
      return
    }

    setIsExecuting(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/custom-queries/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentQuery }),
      })

      const result = await response.json()

      if (result.success) {
        setQueryResult(result.data)
      } else {
        setError(result.error || 'Query execution failed')
      }
    } catch (error) {
      console.error('Error executing query:', error)
      setError('Failed to execute query. Please try again.')
    } finally {
      setIsExecuting(false)
    }
  }

  const saveQuery = async () => {
    if (!queryName.trim() || !currentQuery.trim()) {
      setError('Please provide both a name and query')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const url = editingQuery 
        ? `/api/admin/custom-queries/${editingQuery.id}`
        : '/api/admin/custom-queries'
      
      const method = editingQuery ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: queryName,
          description: queryDescription,
          query: currentQuery,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchSavedQueries()
        setShowSaveDialog(false)
        setQueryName('')
        setQueryDescription('')
        setEditingQuery(null)
      } else {
        setError(result.error || 'Failed to save query')
      }
    } catch (error) {
      console.error('Error saving query:', error)
      setError('Failed to save query. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const loadTemplate = (templateKey: string) => {
    const template = queryTemplates[templateKey]
    setCurrentQuery(template.query)
    setQueryResult(null)
    setError(null)
  }

  const loadSavedQuery = (query: SavedQuery) => {
    setCurrentQuery(query.query)
    setQueryResult(null)
    setError(null)
  }

  const editQuery = (query: SavedQuery) => {
    setEditingQuery(query)
    setQueryName(query.name)
    setQueryDescription(query.description)
    setCurrentQuery(query.query)
    setShowSaveDialog(true)
  }

  const deleteQuery = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this query?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/custom-queries/${queryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchSavedQueries()
      }
    } catch (error) {
      console.error('Error deleting query:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-charcoal">
          Custom Analytics Queries
        </h1>
        <p className="text-charcoal/70">
          Create and execute custom PostHog HogQL queries for advanced analytics
        </p>
      </div>

      {/* Query Templates */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="text-section-title text-charcoal">
            Quick Start Templates
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Choose from pre-built queries to get started quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(queryTemplates).map(([key, template]) => (
              <div
                key={key}
                className="p-4 border border-stone-gray rounded-lg hover:bg-stone-gray/10 cursor-pointer"
                onClick={() => loadTemplate(key)}
              >
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-5 w-5 text-forest-green mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-charcoal">{template.name}</h3>
                    <p className="text-sm text-charcoal/70 mt-1">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Query Editor */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-section-title text-charcoal">
              Query Editor
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowSaveDialog(true)}
                disabled={!currentQuery.trim() || isSaving}
                className="bg-equipment-yellow text-charcoal hover:bg-equipment-yellow/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Query
              </Button>
              <Button
                onClick={executeQuery}
                disabled={!currentQuery.trim() || isExecuting}
                className="bg-forest-green text-white hover:opacity-90"
              >
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Execute
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="query" className="text-label text-charcoal font-medium">
              HogQL Query
            </Label>
            <Textarea
              id="query"
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              placeholder="Enter your HogQL query here..."
              className="mt-2 min-h-[200px] font-mono text-sm bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-equipment-yellow/10 border border-equipment-yellow/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-equipment-yellow" />
              <span className="text-sm text-charcoal">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query Results */}
      {queryResult && (
        <Card className="bg-paper-white border-stone-gray shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-section-title text-charcoal">
                Query Results
              </CardTitle>
              <div className="flex items-center space-x-4 text-sm text-charcoal/70">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{queryResult.query_duration_ms}ms</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>{queryResult.row_count} rows</span>
                </div>
                <Badge variant="outline" className="text-success-green border-success-green">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Success
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {queryResult.results.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {queryResult.columns.map((column, index) => (
                        <TableHead key={index} className="text-charcoal font-semibold">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryResult.results.slice(0, 100).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {queryResult.columns.map((column, colIndex) => (
                          <TableCell key={colIndex} className="font-mono text-sm text-charcoal">
                            {typeof row[column] === 'object' 
                              ? JSON.stringify(row[column])
                              : String(row[column] ?? '')
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {queryResult.results.length > 100 && (
                  <p className="text-sm text-charcoal/70 mt-4 text-center">
                    Showing first 100 rows of {queryResult.row_count} total rows
                  </p>
                )}
              </div>
            ) : (
              <p className="text-charcoal/70 text-center py-8">No results returned</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Saved Queries */}
      <Card className="bg-paper-white border-stone-gray shadow-sm">
        <CardHeader>
          <CardTitle className="text-section-title text-charcoal">
            Saved Queries ({savedQueries.length})
          </CardTitle>
          <CardDescription className="text-charcoal/70">
            Your previously saved custom queries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savedQueries.length > 0 ? (
            <div className="space-y-3">
              {savedQueries.map((query) => (
                <div
                  key={query.id}
                  className="flex items-center justify-between p-4 border border-stone-gray rounded-lg hover:bg-stone-gray/10"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => loadSavedQuery(query)}>
                    <h3 className="font-semibold text-charcoal">{query.name}</h3>
                    {query.description && (
                      <p className="text-sm text-charcoal/70 mt-1">{query.description}</p>
                    )}
                    <p className="text-xs text-charcoal/60 mt-2">
                      Created: {new Date(query.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editQuery(query)}
                      className="p-2 text-charcoal hover:bg-stone-gray/20 rounded"
                      title="Edit query"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteQuery(query.id)}
                      className="p-2 text-error-red hover:bg-error-red/10 rounded"
                      title="Delete query"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-charcoal/70 text-center py-8">
              No saved queries yet. Create your first query above!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Query Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-paper-white rounded-2xl border border-stone-gray/20 shadow-lg p-8">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-bold text-forest-green">
              {editingQuery ? 'Edit Query' : 'Save Query'}
            </DialogTitle>
            <DialogDescription className="text-lg text-charcoal">
              {editingQuery ? 'Update your saved query' : 'Save this query for future use'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="queryName" className="text-label text-charcoal font-medium">
                Query Name
              </Label>
              <Input
                id="queryName"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                placeholder="Enter a name for this query"
                className="mt-2 bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              />
            </div>
            <div>
              <Label htmlFor="queryDesc" className="text-label text-charcoal font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="queryDesc"
                value={queryDescription}
                onChange={(e) => setQueryDescription(e.target.value)}
                placeholder="Describe what this query does"
                className="mt-2 bg-light-concrete text-charcoal border-stone-gray focus:border-forest-green focus:ring-forest-green placeholder:text-charcoal/60"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveDialog(false)
                  setQueryName('')
                  setQueryDescription('')
                  setEditingQuery(null)
                }}
                className="bg-paper-white text-charcoal border-stone-gray hover:bg-stone-gray/20"
              >
                Cancel
              </Button>
              <Button
                onClick={saveQuery}
                disabled={isSaving || !queryName.trim() || !currentQuery.trim()}
                className="bg-forest-green text-white hover:opacity-90"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingQuery ? 'Update' : 'Save'} Query
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}