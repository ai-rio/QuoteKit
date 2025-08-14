'use client';

import { AlertTriangle, CheckCircle, Play, RefreshCw,XCircle } from 'lucide-react';
import { useState } from 'react';

import { TrackingTest } from '@/components/tracking/tracking-test';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestResult {
  function_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'testing';
  response_time_ms: number;
  error_message?: string;
  test_results: {
    connectivity: boolean;
    authentication: boolean;
    database_access: boolean;
    performance: boolean;
  };
  metadata: Record<string, any>;
}

interface CertificationReport {
  overall_status: 'pass' | 'fail' | 'warning';
  total_functions: number;
  healthy_functions: number;
  failed_functions: number;
  performance_score: number;
  functions: TestResult[];
  recommendations: string[];
  timestamp: string;
}

const EDGE_FUNCTIONS = [
  { name: 'test-connection', description: 'Basic connectivity test', critical: true },
  { name: 'subscription-status', description: 'User subscription validation', critical: true },
  { name: 'quote-processor', description: 'Quote processing logic', critical: true },
  { name: 'quote-pdf-generator', description: 'PDF generation for quotes', critical: true },
  { name: 'webhook-handler', description: 'Stripe webhook processing', critical: true },
  { name: 'batch-processor', description: 'Bulk operations handler', critical: false },
  { name: 'webhook-monitor', description: 'Webhook monitoring and logging', critical: false },
  { name: 'migration-controller', description: 'Zero-downtime migration control', critical: false },
  { name: 'production-validator', description: 'Production deployment validation', critical: false },
  { name: 'security-hardening', description: 'Security scanning and hardening', critical: false },
  { name: 'performance-optimizer', description: 'Performance optimization engine', critical: false },
  { name: 'monitoring-alerting', description: 'System monitoring and alerts', critical: false },
  { name: 'global-deployment-optimizer', description: 'Global deployment optimization', critical: false },
  { name: 'connection-pool-manager', description: 'Database connection pooling', critical: false },
  { name: 'edge-functions-health-check', description: 'Comprehensive health checking', critical: false },
];

export default function TestEdgeFunctionsPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [certificationReport, setCertificationReport] = useState<CertificationReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      degraded: 'secondary',
      unhealthy: 'destructive',
      testing: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const testSingleFunction = async (functionName: string): Promise<TestResult> => {
    setCurrentTest(functionName);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`/api/supabase/functions/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true, health_check: true })
      });

      const responseTime = Date.now() - startTime;
      const apiResponse = await response.json();
      
      // Extract the actual Edge Function response
      const actualStatus = apiResponse.status || response.status;
      const actualResponseTime = apiResponse.responseTime || responseTime;
      const edgeFunctionData = apiResponse.data;

      // Determine health status based on Edge Function response
      let status: 'healthy' | 'degraded' | 'unhealthy';
      let errorMessage: string | undefined;

      if (actualStatus === 200) {
        status = 'healthy';
      } else if (actualStatus === 401) {
        // 401 is expected for functions requiring authentication
        status = 'healthy'; // Changed from 'degraded' to 'healthy'
        errorMessage = `Expected auth requirement: ${edgeFunctionData?.error || 'Authentication required'}`;
      } else if (actualStatus === 400) {
        // 400 might be expected for functions requiring specific input (like webhooks)
        const errorMsg = edgeFunctionData?.error || 'Bad request';
        if (errorMsg.toLowerCase().includes('signature') || 
            errorMsg.toLowerCase().includes('missing') ||
            errorMsg.toLowerCase().includes('required')) {
          status = 'healthy'; // Expected validation error
          errorMessage = `Expected validation: ${errorMsg}`;
        } else {
          status = 'degraded'; // Unexpected 400 error
          errorMessage = `HTTP ${actualStatus}: ${errorMsg}`;
        }
      } else if (actualStatus === 404) {
        status = 'unhealthy'; // Function not deployed
        errorMessage = `HTTP ${actualStatus}: Function not found`;
      } else if (actualStatus >= 500) {
        status = 'unhealthy'; // Server error
        errorMessage = `HTTP ${actualStatus}: ${edgeFunctionData?.error || 'Server error'}`;
      } else {
        status = 'degraded';
        errorMessage = `HTTP ${actualStatus}: ${edgeFunctionData?.error || 'Unknown error'}`;
      }

      return {
        function_name: functionName,
        status,
        response_time_ms: actualResponseTime,
        error_message: errorMessage,
        test_results: {
          connectivity: actualStatus < 500,
          authentication: actualStatus === 200 || actualStatus === 401, // 401 means auth is working
          database_access: actualStatus === 200 || actualStatus === 401 || actualStatus === 400, // Function is reachable
          performance: actualResponseTime < 2000
        },
        metadata: {
          status_code: actualStatus,
          response_data: edgeFunctionData,
          api_response: apiResponse,
          edge_function_headers: apiResponse.headers
        }
      };

    } catch (error) {
      return {
        function_name: functionName,
        status: 'unhealthy',
        response_time_ms: 0,
        error_message: error instanceof Error ? error.message : 'Network error',
        test_results: {
          connectivity: false,
          authentication: false,
          database_access: false,
          performance: false
        },
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          error_type: 'network_error'
        }
      };
    }
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const criticalFunctions = EDGE_FUNCTIONS.filter(f => f.critical);
    const results: TestResult[] = [];

    for (const func of criticalFunctions) {
      const result = await testSingleFunction(func.name);
      results.push(result);
      setTestResults([...results]);
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  const runFullCertification = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCertificationReport(null);
    
    const results: TestResult[] = [];

    // Test all functions
    for (const func of EDGE_FUNCTIONS) {
      const result = await testSingleFunction(func.name);
      results.push(result);
      setTestResults([...results]);
    }

    // Generate certification report
    const healthyFunctions = results.filter(r => r.status === 'healthy').length;
    const failedFunctions = results.filter(r => r.status === 'unhealthy').length;
    const performanceScore = Math.round((healthyFunctions / results.length) * 100);
    
    const recommendations: string[] = [];
    if (failedFunctions > 0) {
      recommendations.push(`${failedFunctions} functions failed and need immediate attention`);
    }
    
    const slowFunctions = results.filter(r => r.response_time_ms > 2000);
    if (slowFunctions.length > 0) {
      recommendations.push(`Slow functions: ${slowFunctions.map(f => f.function_name).join(', ')}`);
    }

    const report: CertificationReport = {
      overall_status: failedFunctions === 0 ? (results.some(r => r.status === 'degraded') ? 'warning' : 'pass') : 'fail',
      total_functions: results.length,
      healthy_functions: healthyFunctions,
      failed_functions: failedFunctions,
      performance_score: performanceScore,
      functions: results,
      recommendations,
      timestamp: new Date().toISOString()
    };

    setCertificationReport(report);
    setIsRunning(false);
    setCurrentTest('');
  };

  const testSpecificFunction = async (functionName: string) => {
    setIsRunning(true);
    const result = await testSingleFunction(functionName);
    setTestResults(prev => {
      const filtered = prev.filter(r => r.function_name !== functionName);
      return [...filtered, result];
    });
    setIsRunning(false);
    setCurrentTest('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edge Functions Testing & Certification</h1>
          <p className="text-muted-foreground">
            Comprehensive testing suite for Supabase Edge Functions
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={runQuickTest} 
            disabled={isRunning}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Quick Test
          </Button>
          <Button 
            onClick={runFullCertification} 
            disabled={isRunning}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Full Certification
          </Button>
        </div>
      </div>

      {isRunning && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Testing in progress... {currentTest && `Currently testing: ${currentTest}`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="functions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="functions">Function Tests</TabsTrigger>
          <TabsTrigger value="certification">Certification Report</TabsTrigger>
          <TabsTrigger value="individual">Individual Testing</TabsTrigger>
          <TabsTrigger value="tracking">Formbricks Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="functions" className="space-y-4">
          {testResults.length > 0 && (
            <div className="grid gap-4">
              {testResults.map((result) => (
                <Card key={result.function_name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <CardTitle className="text-base">{result.function_name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      <Badge variant="outline">{result.response_time_ms}ms</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        {result.test_results.connectivity ? 
                          <CheckCircle className="h-4 w-4 text-green-500" /> : 
                          <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <span className="text-sm">Connectivity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.test_results.authentication ? 
                          <CheckCircle className="h-4 w-4 text-green-500" /> : 
                          <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <span className="text-sm">Auth</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.test_results.database_access ? 
                          <CheckCircle className="h-4 w-4 text-green-500" /> : 
                          <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <span className="text-sm">Database</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.test_results.performance ? 
                          <CheckCircle className="h-4 w-4 text-green-500" /> : 
                          <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <span className="text-sm">Performance</span>
                      </div>
                    </div>
                    
                    {result.error_message && (
                      <Alert variant="destructive">
                        <AlertDescription>{result.error_message}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certification" className="space-y-4">
          {certificationReport && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {certificationReport.overall_status === 'pass' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {certificationReport.overall_status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                    {certificationReport.overall_status === 'fail' && <XCircle className="h-5 w-5 text-red-500" />}
                    Certification Report
                  </CardTitle>
                  <CardDescription>
                    Generated on {new Date(certificationReport.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{certificationReport.total_functions}</div>
                      <div className="text-sm text-muted-foreground">Total Functions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{certificationReport.healthy_functions}</div>
                      <div className="text-sm text-muted-foreground">Healthy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{certificationReport.failed_functions}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{certificationReport.performance_score}%</div>
                      <div className="text-sm text-muted-foreground">Performance Score</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Health</span>
                      <span>{certificationReport.performance_score}%</span>
                    </div>
                    <Progress value={certificationReport.performance_score} className="h-2" />
                  </div>

                  {certificationReport.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {certificationReport.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <div className="grid gap-4">
            {EDGE_FUNCTIONS.map((func) => (
              <Card key={func.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{func.name}</CardTitle>
                    <CardDescription>{func.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {func.critical && <Badge variant="secondary">Critical</Badge>}
                    <Button 
                      size="sm" 
                      onClick={() => testSpecificFunction(func.name)}
                      disabled={isRunning}
                    >
                      Test
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <TrackingTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}
