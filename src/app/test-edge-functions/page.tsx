'use client'

/**
 * Comprehensive Edge Functions Integration Test Page
 * Visual testing dashboard for all 14 Edge Functions
 * Access at: http://localhost:3000/test-edge-functions
 */

import { useCallback,useState } from 'react'

import { createClient } from '@/libs/supabase/client'

interface TestResult {
  function: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  responseTime?: number;
  data?: any;
  error?: string;
  timestamp?: string;
}

interface TestConfig {
  name: string;
  displayName: string;
  category: string;
  payload: any;
  description: string;
  critical: boolean;
}

const TEST_CONFIGS: TestConfig[] = [
  // Core Business Functions
  {
    name: 'subscription-status',
    displayName: 'Subscription Status',
    category: 'Core Business',
    critical: true,
    description: 'User subscription and feature access validation',
    payload: { action: 'get-subscription' }
  },
  {
    name: 'quote-processor',
    displayName: 'Quote Processor',
    category: 'Core Business',
    critical: true,
    description: 'Quote creation, calculation, and management',
    payload: {
      operation: 'create',
      quote: {
        client_name: 'Test Client',
        client_email: 'test@example.com',
        line_items: [
          { name: 'Test Service', quantity: 1, unit_price: 100, total: 100 }
        ],
        tax_rate: 8.25,
        notes: 'Frontend integration test quote'
      },
      operations: {
        generate_pdf: false,
        send_email: false,
        update_usage: true,
        auto_save: true
      }
    }
  },
  {
    name: 'quote-pdf-generator',
    displayName: 'PDF Generator',
    category: 'Core Business',
    critical: true,
    description: 'Professional PDF quote generation',
    payload: {
      quote_id: 'test-quote-id',
      template: 'default',
      options: { download: false, email: false }
    }
  },
  
  // Webhook System
  {
    name: 'webhook-handler',
    displayName: 'Webhook Handler',
    category: 'Webhook System',
    critical: true,
    description: 'Stripe webhook processing and routing',
    payload: {
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_frontend',
          customer: 'cus_test_frontend',
          status: 'active'
        }
      },
      livemode: false,
      created: Math.floor(Date.now() / 1000)
    }
  },
  {
    name: 'webhook-monitor',
    displayName: 'Webhook Monitor',
    category: 'Webhook System',
    critical: false,
    description: 'Webhook performance monitoring and metrics',
    payload: { action: 'get-metrics', timeframe: '24h' }
  },
  
  // Batch Operations
  {
    name: 'batch-processor',
    displayName: 'Batch Processor',
    category: 'Batch Operations',
    critical: false,
    description: 'Bulk operations and data processing',
    payload: {
      operation: 'bulk-status-update',
      items: ['quote-1', 'quote-2'],
      status: 'sent',
      options: { notify_clients: false, update_analytics: true }
    }
  },
  
  // Monitoring & Optimization
  {
    name: 'monitoring-alerting',
    displayName: 'Monitoring & Alerting',
    category: 'Monitoring',
    critical: false,
    description: 'System health monitoring and alerting',
    payload: { action: 'health-check', include_metrics: true }
  },
  {
    name: 'performance-optimizer',
    displayName: 'Performance Optimizer',
    category: 'Optimization',
    critical: false,
    description: 'Performance analysis and optimization',
    payload: {
      action: 'analyze',
      target_functions: ['subscription-status', 'quote-processor'],
      optimization_level: 'standard'
    }
  },
  {
    name: 'connection-pool-manager',
    displayName: 'Connection Pool Manager',
    category: 'Optimization',
    critical: false,
    description: 'Database connection pooling management',
    payload: { action: 'status', include_details: true }
  },
  
  // Deployment Functions
  {
    name: 'migration-controller',
    displayName: 'Migration Controller',
    category: 'Deployment',
    critical: false,
    description: 'Zero-downtime migration management',
    payload: { action: 'status', include_health: true }
  },
  {
    name: 'production-validator',
    displayName: 'Production Validator',
    category: 'Deployment',
    critical: false,
    description: 'Production deployment validation',
    payload: {
      action: 'validate',
      validation_type: 'quick',
      include_security: false
    }
  },
  {
    name: 'security-hardening',
    displayName: 'Security Hardening',
    category: 'Security',
    critical: false,
    description: 'Security scanning and hardening',
    payload: {
      action: 'scan',
      scan_type: 'basic',
      target: 'local'
    }
  },
  {
    name: 'global-deployment-optimizer',
    displayName: 'Global Deployment Optimizer',
    category: 'Optimization',
    critical: false,
    description: 'Global deployment optimization',
    payload: {
      action: 'optimize',
      optimization_type: 'performance',
      dry_run: true
    }
  }
]

export default function TestAllEdgeFunctions() {
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [isRunningAll, setIsRunningAll] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [showOnlyFailed, setShowOnlyFailed] = useState(false)
  const supabase = createClient()

  const updateResult = useCallback((functionName: string, result: Partial<TestResult>) => {
    setResults(prev => ({
      ...prev,
      [functionName]: { 
        ...prev[functionName], 
        function: functionName, 
        timestamp: new Date().toLocaleTimeString(),
        ...result 
      }
    }))
  }, [])

  const testFunction = useCallback(async (config: TestConfig) => {
    updateResult(config.name, { status: 'testing' })
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.functions.invoke(config.name, {
        body: config.payload
      })
      
      const responseTime = Date.now() - startTime
      
      if (error) {
        updateResult(config.name, { 
          status: 'error', 
          responseTime, 
          error: error.message 
        })
      } else {
        updateResult(config.name, { 
          status: 'success', 
          responseTime, 
          data 
        })
      }
    } catch (err: any) {
      const responseTime = Date.now() - startTime
      updateResult(config.name, { 
        status: 'error', 
        responseTime, 
        error: err.message || 'Unknown error occurred'
      })
    }
  }, [supabase, updateResult])

  const runAllTests = useCallback(async () => {
    setIsRunningAll(true)
    setResults({}) // Clear previous results
    
    console.log('🧪 Starting comprehensive Edge Functions test...')
    
    // Test critical functions first
    const criticalFunctions = TEST_CONFIGS.filter(config => config.critical)
    const nonCriticalFunctions = TEST_CONFIGS.filter(config => !config.critical)
    
    // Run critical functions first
    for (const config of criticalFunctions) {
      console.log(`🔄 Testing critical function: ${config.name}`)
      await testFunction(config)
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1s delay
    }
    
    // Then run non-critical functions
    for (const config of nonCriticalFunctions) {
      console.log(`🔄 Testing function: ${config.name}`)
      await testFunction(config)
      await new Promise(resolve => setTimeout(resolve, 500)) // 0.5s delay
    }
    
    setIsRunningAll(false)
    console.log('✅ All Edge Functions tests completed')
  }, [testFunction])

  const runCriticalTests = useCallback(async () => {
    const criticalConfigs = TEST_CONFIGS.filter(config => config.critical)
    
    for (const config of criticalConfigs) {
      await testFunction(config)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }, [testFunction])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200'
      case 'error': return 'text-red-700 bg-red-50 border-red-200'
      case 'testing': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'testing': return '⏳'
      default: return '⚪'
    }
  }

  const getResponseTimeColor = (responseTime?: number) => {
    if (!responseTime) return 'text-gray-500'
    if (responseTime < 1000) return 'text-green-600'
    if (responseTime < 2000) return 'text-yellow-600'
    return 'text-red-600'
  }

  const categories = ['All', ...Array.from(new Set(TEST_CONFIGS.map(config => config.category)))]
  const filteredConfigs = TEST_CONFIGS.filter(config => {
    const categoryMatch = selectedCategory === 'All' || config.category === selectedCategory
    const failedMatch = !showOnlyFailed || results[config.name]?.status === 'error'
    return categoryMatch && failedMatch
  })

  const successCount = Object.values(results).filter(r => r.status === 'success').length
  const errorCount = Object.values(results).filter(r => r.status === 'error').length
  const testingCount = Object.values(results).filter(r => r.status === 'testing').length
  const totalCount = Object.keys(results).length
  const criticalSuccessCount = TEST_CONFIGS
    .filter(config => config.critical)
    .filter(config => results[config.name]?.status === 'success').length
  const criticalTotalCount = TEST_CONFIGS.filter(config => config.critical).length

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edge Functions Integration Test</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive testing dashboard for all 14 Edge Functions
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {successCount}/{TEST_CONFIGS.length}
              </div>
              <div className="text-sm text-gray-500">Functions Passing</div>
            </div>
          </div>
          
          {/* Control Panel */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button 
              onClick={runAllTests}
              disabled={isRunningAll}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              {isRunningAll ? 'Running All Tests...' : 'Run All Tests'}
            </button>
            
            <button 
              onClick={runCriticalTests}
              disabled={isRunningAll}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors"
            >
              Run Critical Tests Only
            </button>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlyFailed}
                onChange={(e) => setShowOnlyFailed(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Show only failed</span>
            </label>
          </div>
          
          {/* Status Summary */}
          {totalCount > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{testingCount}</div>
                <div className="text-sm text-gray-600">Testing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {criticalSuccessCount}/{criticalTotalCount}
                </div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Test Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredConfigs.map(config => {
            const result = results[config.name] || { function: config.name, status: 'idle' }
            
            return (
              <div 
                key={config.name} 
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{config.displayName}</h3>
                      {config.critical && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Critical
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{config.category}</div>
                    <div className="text-xs text-gray-500">{config.description}</div>
                  </div>
                  <span className="text-2xl ml-2">{getStatusIcon(result.status)}</span>
                </div>
                
                {/* Metrics */}
                <div className="space-y-1 text-xs">
                  {result.responseTime && (
                    <div className={`font-medium ${getResponseTimeColor(result.responseTime)}`}>
                      Response: {result.responseTime}ms
                    </div>
                  )}
                  
                  {result.timestamp && (
                    <div className="text-gray-500">
                      Last tested: {result.timestamp}
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="text-red-600 mt-2 p-2 bg-red-50 rounded text-xs">
                      {result.error}
                    </div>
                  )}
                  
                  {result.status === 'success' && result.data && (
                    <div className="text-green-600 mt-2 p-2 bg-green-50 rounded text-xs">
                      ✓ Response received successfully
                    </div>
                  )}
                </div>
                
                {/* Individual Test Button */}
                <button
                  onClick={() => testFunction(config)}
                  disabled={result.status === 'testing' || isRunningAll}
                  className="w-full mt-3 px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {result.status === 'testing' ? 'Testing...' : 'Test Function'}
                </button>
              </div>
            )
          })}
        </div>
        
        {/* Success Message */}
        {successCount === TEST_CONFIGS.length && (
          <div className="mt-6 p-6 bg-green-100 border border-green-200 text-green-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="font-semibold text-lg">All Edge Functions Working!</h3>
                <p className="text-green-700">
                  All {TEST_CONFIGS.length} Edge Functions are responding correctly. 
                  System is ready for production deployment.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Critical Functions Warning */}
        {criticalSuccessCount < criticalTotalCount && totalCount > 0 && (
          <div className="mt-6 p-6 bg-red-100 border border-red-200 text-red-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <h3 className="font-semibold text-lg">Critical Functions Failed</h3>
                <p className="text-red-700">
                  {criticalTotalCount - criticalSuccessCount} critical function(s) are failing. 
                  These must be fixed before production deployment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
