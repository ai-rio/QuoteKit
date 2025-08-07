/**
 * Connection Pool Performance Testing
 * Tests database connection pooling under load
 * Run with: deno run --allow-all scripts/connection-pool-test.ts
 */

interface ConnectionPoolTestResult {
  testName: string;
  concurrentRequests: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  requestsPerSecond: number;
  successRate: number;
  connectionErrors: number;
  timeoutErrors: number;
}

interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  poolUtilization: number;
  avgResponseTime: number;
  errorRate: number;
}

// Environment configuration
const SUPABASE_PROJECT_ID = Deno.env.get('SUPABASE_PROJECT_ID') || 
  Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')?.split('//')[1]?.split('.')[0]
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 
  Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

const isLocal = Deno.args.includes('--local')
const BASE_URL = isLocal 
  ? 'http://localhost:54321/functions/v1'
  : `https://${SUPABASE_PROJECT_ID}.functions.supabase.co`

if (!isLocal && (!SUPABASE_PROJECT_ID || !SUPABASE_ANON_KEY)) {
  console.error('❌ Missing environment variables for production testing')
  Deno.exit(1)
}

const AUTH_HEADER = isLocal 
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token'
  : SUPABASE_ANON_KEY!

async function testConnectionPooling(): Promise<void> {
  console.log('🔗 Connection Pool Performance Testing')
  console.log('=====================================')
  console.log(`Mode: ${isLocal ? 'Local' : 'Production'}`)
  console.log(`Target: ${BASE_URL}`)
  console.log('=====================================\n')

  const testResults: ConnectionPoolTestResult[] = []

  // Test 1: Light Load (5 concurrent requests)
  console.log('📊 Test 1: Light Load (5 concurrent)')
  const lightLoadResult = await runConnectionPoolTest('Light Load', 5, 30)
  testResults.push(lightLoadResult)
  await new Promise(resolve => setTimeout(resolve, 5000)) // Cool down

  // Test 2: Medium Load (15 concurrent requests)
  console.log('\n📊 Test 2: Medium Load (15 concurrent)')
  const mediumLoadResult = await runConnectionPoolTest('Medium Load', 15, 30)
  testResults.push(mediumLoadResult)
  await new Promise(resolve => setTimeout(resolve, 5000)) // Cool down

  // Test 3: Heavy Load (25 concurrent requests)
  console.log('\n📊 Test 3: Heavy Load (25 concurrent)')
  const heavyLoadResult = await runConnectionPoolTest('Heavy Load', 25, 30)
  testResults.push(heavyLoadResult)
  await new Promise(resolve => setTimeout(resolve, 5000)) // Cool down

  // Test 4: Burst Load (50 concurrent requests for short duration)
  console.log('\n📊 Test 4: Burst Load (50 concurrent)')
  const burstLoadResult = await runConnectionPoolTest('Burst Load', 50, 15)
  testResults.push(burstLoadResult)

  // Generate comprehensive report
  await generateConnectionPoolReport(testResults)
}

async function runConnectionPoolTest(
  testName: string, 
  concurrentRequests: number, 
  durationSeconds: number
): Promise<ConnectionPoolTestResult> {
  
  console.log(`🔄 Running ${testName} test...`)
  console.log(`   Concurrent requests: ${concurrentRequests}`)
  console.log(`   Duration: ${durationSeconds}s`)

  const responseTimes: number[] = []
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    connectionErrors: 0,
    timeoutErrors: 0
  }

  const startTime = Date.now()
  const endTime = startTime + (durationSeconds * 1000)

  // Create worker promises
  const workers = Array.from({ length: concurrentRequests }, async (_, workerId) => {
    let workerRequests = 0
    let workerSuccesses = 0

    while (Date.now() < endTime) {
      const requestStart = Date.now()
      
      try {
        const response = await fetch(`${BASE_URL}/connection-pool-manager`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AUTH_HEADER}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            action: 'status',
            include_details: true,
            worker_id: workerId
          }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        const requestTime = Date.now() - requestStart
        workerRequests++

        if (response.ok) {
          workerSuccesses++
          responseTimes.push(requestTime)
        } else {
          results.failedRequests++
          if (response.status >= 500) {
            results.connectionErrors++
          }
        }
      } catch (error) {
        workerRequests++
        results.failedRequests++
        
        if (error.name === 'TimeoutError') {
          results.timeoutErrors++
        } else {
          results.connectionErrors++
        }
      }

      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    results.totalRequests += workerRequests
    results.successfulRequests += workerSuccesses
  })

  // Wait for all workers to complete
  await Promise.all(workers)

  // Calculate statistics
  const actualDuration = (Date.now() - startTime) / 1000
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0
  
  const sortedTimes = responseTimes.sort((a, b) => a - b)
  const minResponseTime = sortedTimes[0] || 0
  const maxResponseTime = sortedTimes[sortedTimes.length - 1] || 0
  const p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0
  
  const requestsPerSecond = results.totalRequests / actualDuration
  const successRate = results.totalRequests > 0 
    ? (results.successfulRequests / results.totalRequests) * 100 
    : 0

  // Display results
  console.log(`   ✅ Total requests: ${results.totalRequests}`)
  console.log(`   ✅ Successful: ${results.successfulRequests}`)
  console.log(`   ❌ Failed: ${results.failedRequests}`)
  console.log(`   🔗 Connection errors: ${results.connectionErrors}`)
  console.log(`   ⏰ Timeout errors: ${results.timeoutErrors}`)
  console.log(`   📈 Success rate: ${successRate.toFixed(1)}%`)
  console.log(`   ⚡ Requests/sec: ${requestsPerSecond.toFixed(1)}`)
  console.log(`   ⏱️  Avg response: ${averageResponseTime.toFixed(0)}ms`)
  console.log(`   📊 95th percentile: ${p95ResponseTime}ms`)

  // Performance assessment
  if (successRate >= 95 && averageResponseTime < 1000) {
    console.log(`   🎯 Performance: Excellent`)
  } else if (successRate >= 90 && averageResponseTime < 2000) {
    console.log(`   🎯 Performance: Good`)
  } else if (successRate >= 80) {
    console.log(`   🎯 Performance: Acceptable`)
  } else {
    console.log(`   🎯 Performance: Needs Improvement`)
  }

  return {
    testName,
    concurrentRequests,
    totalRequests: results.totalRequests,
    successfulRequests: results.successfulRequests,
    failedRequests: results.failedRequests,
    averageResponseTime,
    minResponseTime,
    maxResponseTime,
    p95ResponseTime,
    requestsPerSecond,
    successRate,
    connectionErrors: results.connectionErrors,
    timeoutErrors: results.timeoutErrors
  }
}

async function getPoolStats(): Promise<PoolStats | null> {
  try {
    const response = await fetch(`${BASE_URL}/connection-pool-manager`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_HEADER}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'status', include_details: true }),
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const data = await response.json()
      return data.poolStats || null
    }
  } catch (error) {
    console.warn('Could not retrieve pool stats:', error.message)
  }
  
  return null
}

async function generateConnectionPoolReport(results: ConnectionPoolTestResult[]): Promise<void> {
  console.log('\n' + '='.repeat(60))
  console.log('📊 CONNECTION POOL TEST REPORT')
  console.log('='.repeat(60))

  // Overall statistics
  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0)
  const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0)
  const overallSuccessRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0
  const avgResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length

  console.log(`📈 Overall Statistics:`)
  console.log(`   Total Requests: ${totalRequests}`)
  console.log(`   Success Rate: ${overallSuccessRate.toFixed(1)}%`)
  console.log(`   Average Response Time: ${avgResponseTime.toFixed(0)}ms`)

  // Test breakdown
  console.log(`\n📋 Test Results Breakdown:`)
  results.forEach(result => {
    console.log(`\n   ${result.testName}:`)
    console.log(`     Concurrent: ${result.concurrentRequests}`)
    console.log(`     Success Rate: ${result.successRate.toFixed(1)}%`)
    console.log(`     Avg Response: ${result.averageResponseTime.toFixed(0)}ms`)
    console.log(`     RPS: ${result.requestsPerSecond.toFixed(1)}`)
    console.log(`     Connection Errors: ${result.connectionErrors}`)
    console.log(`     Timeout Errors: ${result.timeoutErrors}`)
  })

  // Performance analysis
  console.log(`\n🔍 Performance Analysis:`)
  
  const excellentTests = results.filter(r => r.successRate >= 95 && r.averageResponseTime < 1000)
  const goodTests = results.filter(r => r.successRate >= 90 && r.averageResponseTime < 2000)
  const poorTests = results.filter(r => r.successRate < 80 || r.averageResponseTime > 3000)

  console.log(`   Excellent Performance: ${excellentTests.length}/${results.length} tests`)
  console.log(`   Good Performance: ${goodTests.length}/${results.length} tests`)
  console.log(`   Poor Performance: ${poorTests.length}/${results.length} tests`)

  if (poorTests.length > 0) {
    console.log(`\n   ⚠️  Tests with poor performance:`)
    poorTests.forEach(test => {
      console.log(`     - ${test.testName}: ${test.successRate.toFixed(1)}% success, ${test.averageResponseTime.toFixed(0)}ms avg`)
    })
  }

  // Connection pool health
  console.log(`\n🔗 Connection Pool Health:`)
  const poolStats = await getPoolStats()
  if (poolStats) {
    console.log(`   Total Connections: ${poolStats.totalConnections}`)
    console.log(`   Active Connections: ${poolStats.activeConnections}`)
    console.log(`   Idle Connections: ${poolStats.idleConnections}`)
    console.log(`   Pool Utilization: ${poolStats.poolUtilization.toFixed(1)}%`)
    console.log(`   Error Rate: ${poolStats.errorRate.toFixed(2)}%`)
  } else {
    console.log(`   ⚠️  Could not retrieve pool statistics`)
  }

  // Recommendations
  console.log(`\n💡 Recommendations:`)
  
  if (overallSuccessRate < 95) {
    console.log(`   - Improve connection pool configuration (current success rate: ${overallSuccessRate.toFixed(1)}%)`)
  }
  
  if (avgResponseTime > 1500) {
    console.log(`   - Optimize database queries or increase pool size (current avg: ${avgResponseTime.toFixed(0)}ms)`)
  }
  
  const highErrorTests = results.filter(r => r.connectionErrors > r.totalRequests * 0.05)
  if (highErrorTests.length > 0) {
    console.log(`   - Review connection timeout settings (high connection error rate detected)`)
  }
  
  const highTimeoutTests = results.filter(r => r.timeoutErrors > r.totalRequests * 0.02)
  if (highTimeoutTests.length > 0) {
    console.log(`   - Consider increasing request timeout limits`)
  }

  if (poolStats && poolStats.poolUtilization > 80) {
    console.log(`   - Consider increasing maximum pool size (current utilization: ${poolStats.poolUtilization.toFixed(1)}%)`)
  }

  // Final assessment
  console.log(`\n🎯 Final Assessment:`)
  if (overallSuccessRate >= 95 && avgResponseTime < 1000 && poorTests.length === 0) {
    console.log(`   ✅ Connection pool is performing excellently`)
    console.log(`   🚀 Ready for production deployment`)
  } else if (overallSuccessRate >= 90 && avgResponseTime < 2000) {
    console.log(`   ✅ Connection pool is performing well`)
    console.log(`   ⚠️  Minor optimizations recommended`)
  } else {
    console.log(`   ❌ Connection pool needs optimization`)
    console.log(`   🔧 Address performance issues before production`)
  }

  // Save detailed report
  const reportFile = `connection-pool-test-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
  const report = {
    timestamp: new Date().toISOString(),
    mode: isLocal ? 'local' : 'production',
    overall: {
      totalRequests,
      successRate: overallSuccessRate,
      averageResponseTime: avgResponseTime
    },
    tests: results,
    poolStats,
    assessment: {
      excellent: excellentTests.length,
      good: goodTests.length,
      poor: poorTests.length
    }
  }

  await Deno.writeTextFile(reportFile, JSON.stringify(report, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportFile}`)

  console.log('\n' + '='.repeat(60))
}

// Main execution
if (import.meta.main) {
  try {
    await testConnectionPooling()
    console.log('\n✅ Connection pool testing completed successfully')
  } catch (error) {
    console.error('\n❌ Connection pool testing failed:', error.message)
    Deno.exit(1)
  }
}
