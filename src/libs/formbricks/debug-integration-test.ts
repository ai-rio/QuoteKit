/**
 * Integration test utilities for Formbricks debug system
 * This module provides functions to test the debug system integration
 */

import { getFormbricksDebugManager } from './formbricks-manager'
import { FormbricksManager } from './formbricks-manager'

export class FormbricksIntegrationTester {
  private debugManager = getFormbricksDebugManager()
  private formbricksManager = FormbricksManager.getInstance()

  /**
   * Run comprehensive integration tests
   */
  async runIntegrationTests(): Promise<{
    success: boolean
    results: Array<{
      test: string
      passed: boolean
      message: string
      details?: any
    }>
  }> {
    const results = []

    console.log('🧪 Starting Formbricks integration tests...')

    // Test 1: Debug Manager Initialization
    try {
      const debugManagerInstance = getFormbricksDebugManager()
      results.push({
        test: 'Debug Manager Initialization',
        passed: !!debugManagerInstance,
        message: debugManagerInstance ? 'Debug manager initialized successfully' : 'Debug manager failed to initialize',
        details: { hasInstance: !!debugManagerInstance }
      })
    } catch (error) {
      results.push({
        test: 'Debug Manager Initialization',
        passed: false,
        message: `Debug manager initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }

    // Test 2: Formbricks Manager Integration
    try {
      const managerStatus = this.formbricksManager.getStatus()
      results.push({
        test: 'Formbricks Manager Integration',
        passed: true,
        message: 'Successfully integrated with Formbricks manager',
        details: managerStatus
      })
    } catch (error) {
      results.push({
        test: 'Formbricks Manager Integration',
        passed: false,
        message: `Manager integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }

    // Test 3: Debug Diagnostic System
    try {
      const diagnostics = await this.debugManager.runDiagnostics()
      results.push({
        test: 'Debug Diagnostic System',
        passed: !!diagnostics && diagnostics.results.length > 0,
        message: diagnostics ? `Diagnostics completed with ${diagnostics.results.length} categories` : 'Diagnostics failed',
        details: { 
          categoriesCount: diagnostics?.results.length || 0,
          overallStatus: diagnostics?.overallStatus,
          summary: diagnostics?.summary
        }
      })
    } catch (error) {
      results.push({
        test: 'Debug Diagnostic System',
        passed: false,
        message: `Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }

    // Test 4: Event Triggering System
    try {
      const testEvent = this.debugManager.triggerTestEvent('integration_test', { 
        testId: 'integration-test-' + Date.now(),
        source: 'FormbricksIntegrationTester'
      })
      results.push({
        test: 'Event Triggering System',
        passed: testEvent.success,
        message: testEvent.success ? 'Event triggering system working correctly' : 'Event triggering failed',
        details: testEvent
      })
    } catch (error) {
      results.push({
        test: 'Event Triggering System',
        passed: false,
        message: `Event triggering failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }

    // Test 5: Widget Testing System
    try {
      const widgetTests = await this.debugManager.testAllWidgetOptions()
      const passedWidgetTests = widgetTests.tests.filter(t => t.status === 'success').length
      results.push({
        test: 'Widget Testing System',
        passed: passedWidgetTests > 0,
        message: `Widget testing completed: ${passedWidgetTests}/${widgetTests.tests.length} widgets tested successfully`,
        details: {
          totalTests: widgetTests.tests.length,
          passedTests: passedWidgetTests,
          failedTests: widgetTests.tests.filter(t => t.status === 'error').length
        }
      })
    } catch (error) {
      results.push({
        test: 'Widget Testing System',
        passed: false,
        message: `Widget testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }

    // Test 6: Export System
    try {
      const exportData = this.debugManager.exportDebugData()
      results.push({
        test: 'Debug Data Export System',
        passed: !!exportData && typeof exportData === 'object',
        message: exportData ? 'Export system working correctly' : 'Export system failed',
        details: {
          hasTimestamp: !!exportData?.timestamp,
          hasEnvironment: !!exportData?.environment,
          hasFormbricksManager: !!exportData?.formbricksManager,
          hasDebugResults: !!exportData?.debugResults
        }
      })
    } catch (error) {
      results.push({
        test: 'Debug Data Export System',
        passed: false,
        message: `Export system failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      })
    }

    const totalTests = results.length
    const passedTests = results.filter(r => r.passed).length
    const success = passedTests === totalTests

    console.log(`🧪 Integration tests completed: ${passedTests}/${totalTests} tests passed`)

    return {
      success,
      results
    }
  }

  /**
   * Run a quick smoke test to verify basic functionality
   */
  async runSmokeTest(): Promise<{
    success: boolean
    message: string
    details: any
  }> {
    try {
      // Quick checks for core functionality
      const debugManager = getFormbricksDebugManager()
      const formbricksManager = FormbricksManager.getInstance()
      
      const checks = {
        debugManagerExists: !!debugManager,
        formbricksManagerExists: !!formbricksManager,
        canGetStatus: !!formbricksManager.getStatus(),
        canTriggerEvent: !!debugManager.triggerTestEvent('smoke_test', { test: true }),
        canExport: !!debugManager.exportDebugData()
      }

      const allPassed = Object.values(checks).every(check => check === true)

      return {
        success: allPassed,
        message: allPassed ? 'All smoke tests passed' : 'Some smoke tests failed',
        details: checks
      }
    } catch (error) {
      return {
        success: false,
        message: `Smoke test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      }
    }
  }

  /**
   * Test API endpoints
   */
  async testAPIEndpoints(): Promise<{
    success: boolean
    results: Array<{
      endpoint: string
      status: number
      success: boolean
      message: string
      data?: any
    }>
  }> {
    const endpoints = [
      { name: 'Basic API Test', url: '/api/formbricks/test', method: 'GET' },
      { 
        name: 'Comprehensive Test', 
        url: '/api/formbricks/test', 
        method: 'POST',
        body: { action: 'comprehensive_test' }
      },
      { 
        name: 'Environment Validation', 
        url: '/api/formbricks/test', 
        method: 'POST',
        body: { action: 'validate_environment' }
      },
      { 
        name: 'Survey Test', 
        url: '/api/formbricks/test', 
        method: 'POST',
        body: { action: 'test_surveys' }
      }
    ]

    const results = []

    for (const endpoint of endpoints) {
      try {
        const requestOptions: RequestInit = {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          }
        }

        if (endpoint.body) {
          requestOptions.body = JSON.stringify(endpoint.body)
        }

        const response = await fetch(endpoint.url, requestOptions)
        const data = await response.json()

        results.push({
          endpoint: endpoint.name,
          status: response.status,
          success: response.ok,
          message: data.message || (response.ok ? 'Success' : 'Failed'),
          data
        })
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          status: 0,
          success: false,
          message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: { error }
        })
      }
    }

    const success = results.every(r => r.success)

    return { success, results }
  }
}

/**
 * Get integration tester instance
 */
export function getFormbricksIntegrationTester(): FormbricksIntegrationTester {
  return new FormbricksIntegrationTester()
}

/**
 * Quick function to run all tests
 */
export async function runAllFormbricksTests(): Promise<{
  integrationTests: any
  smokeTest: any
  apiTests: any
  summary: {
    allPassed: boolean
    totalCategories: number
    passedCategories: number
  }
}> {
  const tester = getFormbricksIntegrationTester()
  
  console.log('🚀 Running comprehensive Formbricks test suite...')
  
  const [integrationTests, smokeTest, apiTests] = await Promise.all([
    tester.runIntegrationTests().catch(e => ({ success: false, error: e.message })),
    tester.runSmokeTest().catch(e => ({ success: false, error: e.message })),
    tester.testAPIEndpoints().catch(e => ({ success: false, error: e.message }))
  ])

  const passedCategories = [
    integrationTests.success,
    smokeTest.success,
    apiTests.success
  ].filter(Boolean).length

  const allPassed = passedCategories === 3

  console.log(`🏁 Test suite completed: ${passedCategories}/3 categories passed`)

  return {
    integrationTests,
    smokeTest,
    apiTests,
    summary: {
      allPassed,
      totalCategories: 3,
      passedCategories
    }
  }
}