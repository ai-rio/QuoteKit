/**
 * Sprint 4: Database Connection Pooling Optimization
 * Advanced connection pooling for Edge Functions with performance monitoring
 * Implements connection reuse, health checking, and automatic scaling
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Connection pool configuration
interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeout: number; // milliseconds
  connectionTimeout: number; // milliseconds
  healthCheckInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  acquireTimeout: number; // milliseconds
  enableHealthCheck: boolean;
  enableMetrics: boolean;
}

// Connection status
interface PoolConnection {
  id: string;
  client: any;
  isIdle: boolean;
  createdAt: number;
  lastUsed: number;
  healthScore: number; // 0-100
  queryCount: number;
  errorCount: number;
  inUse: boolean;
}

// Pool metrics
interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingAcquisitions: number;
  totalQueries: number;
  avgResponseTime: number;
  errorRate: number;
  connectionAcquisitionTime: number;
  poolUtilization: number; // percentage
}

// Connection pool class
class DatabaseConnectionPool {
  private config: ConnectionPoolConfig;
  private connections: Map<string, PoolConnection> = new Map();
  private pendingAcquisitions: Array<{
    resolve: (connection: PoolConnection) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private healthCheckTimer?: number;
  private metricsTimer?: number;
  private metrics: PoolMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    pendingAcquisitions: 0,
    totalQueries: 0,
    avgResponseTime: 0,
    errorRate: 0,
    connectionAcquisitionTime: 0,
    poolUtilization: 0
  };

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnections: config.maxConnections || 20,
      minConnections: config.minConnections || 2,
      idleTimeout: config.idleTimeout || 300000, // 5 minutes
      connectionTimeout: config.connectionTimeout || 30000, // 30 seconds
      healthCheckInterval: config.healthCheckInterval || 60000, // 1 minute
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000, // 1 second
      acquireTimeout: config.acquireTimeout || 10000, // 10 seconds
      enableHealthCheck: config.enableHealthCheck ?? true,
      enableMetrics: config.enableMetrics ?? true
    };

    this.initialize();
  }

  /**
   * Initialize the connection pool
   */
  private async initialize(): Promise<void> {
    console.log('Initializing database connection pool...');
    
    // Create minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      try {
        await this.createConnection();
      } catch (error) {
        console.error(`Failed to create initial connection ${i}:`, error);
      }
    }

    // Start health check timer
    if (this.config.enableHealthCheck) {
      this.startHealthCheck();
    }

    // Start metrics collection
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    console.log(`Connection pool initialized with ${this.connections.size} connections`);
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<PoolConnection> {
    const startTime = Date.now();

    // Try to get an idle connection first
    const idleConnection = this.getIdleConnection();
    if (idleConnection) {
      idleConnection.inUse = true;
      idleConnection.lastUsed = Date.now();
      this.updateMetrics();
      return idleConnection;
    }

    // Create new connection if under max limit
    if (this.connections.size < this.config.maxConnections) {
      try {
        const connection = await this.createConnection();
        connection.inUse = true;
        connection.lastUsed = Date.now();
        this.updateMetrics();
        return connection;
      } catch (error) {
        console.error('Failed to create new connection:', error);
      }
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.pendingAcquisitions.findIndex(req => req.resolve === resolve);
        if (index !== -1) {
          this.pendingAcquisitions.splice(index, 1);
        }
        reject(new Error('Connection acquisition timeout'));
      }, this.config.acquireTimeout);

      this.pendingAcquisitions.push({
        resolve: (connection: PoolConnection) => {
          clearTimeout(timeout);
          connection.inUse = true;
          connection.lastUsed = Date.now();
          
          // Update acquisition time metric
          const acquisitionTime = Date.now() - startTime;
          this.metrics.connectionAcquisitionTime = 
            (this.metrics.connectionAcquisitionTime + acquisitionTime) / 2;
          
          this.updateMetrics();
          resolve(connection);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: startTime
      });
    });
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: PoolConnection): void {
    connection.inUse = false;
    connection.isIdle = true;
    connection.lastUsed = Date.now();

    // If there are pending acquisitions, fulfill one
    const pendingAcquisition = this.pendingAcquisitions.shift();
    if (pendingAcquisition) {
      pendingAcquisition.resolve(connection);
      return;
    }

    this.updateMetrics();
  }

  /**
   * Execute a query with automatic connection management
   */
  async query<T = any>(
    queryFn: (client: any) => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await this.acquire();
      const startTime = Date.now();
      
      const result = await queryFn(connection.client);
      
      // Update connection metrics
      connection.queryCount++;
      const queryTime = Date.now() - startTime;
      this.metrics.totalQueries++;
      this.metrics.avgResponseTime = 
        (this.metrics.avgResponseTime + queryTime) / 2;
      
      return result;
      
    } catch (error) {
      if (connection) {
        connection.errorCount++;
        connection.healthScore = Math.max(0, connection.healthScore - 10);
      }
      
      this.metrics.errorRate = 
        (this.metrics.errorRate + 1) / (this.metrics.totalQueries + 1);

      // Retry logic
      if (retries > 0 && this.isRetryableError(error)) {
        console.warn(`Query failed, retrying... (${retries} attempts left)`, error);
        await this.delay(this.config.retryDelay);
        return this.query(queryFn, retries - 1);
      }
      
      throw error;
      
    } finally {
      if (connection) {
        this.release(connection);
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detailed connection information
   */
  getConnectionDetails(): Array<{
    id: string;
    isIdle: boolean;
    inUse: boolean;
    age: number;
    queryCount: number;
    errorCount: number;
    healthScore: number;
  }> {
    const now = Date.now();
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      isIdle: conn.isIdle,
      inUse: conn.inUse,
      age: now - conn.createdAt,
      queryCount: conn.queryCount,
      errorCount: conn.errorCount,
      healthScore: conn.healthScore
    }));
  }

  /**
   * Gracefully shutdown the pool
   */
  async destroy(): Promise<void> {
    console.log('Shutting down connection pool...');
    
    // Clear timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }

    // Reject pending acquisitions
    this.pendingAcquisitions.forEach(req => {
      req.reject(new Error('Connection pool is shutting down'));
    });
    this.pendingAcquisitions.clear();

    // Close all connections
    const closePromises = Array.from(this.connections.values()).map(async (conn) => {
      try {
        if (conn.client && typeof conn.client.destroy === 'function') {
          await conn.client.destroy();
        }
      } catch (error) {
        console.error(`Error closing connection ${conn.id}:`, error);
      }
    });

    await Promise.allSettled(closePromises);
    this.connections.clear();
    
    console.log('Connection pool shutdown complete');
  }

  /**
   * Private helper methods
   */

  private async createConnection(): Promise<PoolConnection> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const client = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Test the connection
      await this.testConnection(client);

      const connection: PoolConnection = {
        id: connectionId,
        client,
        isIdle: true,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        healthScore: 100,
        queryCount: 0,
        errorCount: 0,
        inUse: false
      };

      this.connections.set(connectionId, connection);
      console.log(`Created connection ${connectionId}`);
      
      return connection;
      
    } catch (error) {
      console.error(`Failed to create connection ${connectionId}:`, error);
      throw error;
    }
  }

  private getIdleConnection(): PoolConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.isIdle && !connection.inUse && connection.healthScore > 50) {
        connection.isIdle = false;
        return connection;
      }
    }
    return null;
  }

  private async testConnection(client: any): Promise<void> {
    try {
      // Simple health check query
      await client.from('edge_function_performance').select('id').limit(1);
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    for (const [id, connection] of this.connections.entries()) {
      // Check if connection is too old
      const age = now - connection.createdAt;
      if (age > this.config.idleTimeout) {
        connectionsToRemove.push(id);
        continue;
      }

      // Check if connection has been idle too long
      const idleTime = now - connection.lastUsed;
      if (idleTime > this.config.idleTimeout && connection.isIdle && !connection.inUse) {
        connectionsToRemove.push(id);
        continue;
      }

      // Perform health check on idle connections
      if (connection.isIdle && !connection.inUse) {
        try {
          await this.testConnection(connection.client);
          connection.healthScore = Math.min(100, connection.healthScore + 5);
        } catch (error) {
          connection.healthScore = Math.max(0, connection.healthScore - 20);
          console.warn(`Health check failed for connection ${id}:`, error);
          
          if (connection.healthScore < 30) {
            connectionsToRemove.push(id);
          }
        }
      }
    }

    // Remove unhealthy connections
    for (const id of connectionsToRemove) {
      await this.removeConnection(id);
    }

    // Ensure minimum connections
    const currentConnections = this.connections.size;
    if (currentConnections < this.config.minConnections) {
      const connectionsNeeded = this.config.minConnections - currentConnections;
      for (let i = 0; i < connectionsNeeded; i++) {
        try {
          await this.createConnection();
        } catch (error) {
          console.error('Failed to create connection during health check:', error);
        }
      }
    }
  }

  private async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      if (connection.client && typeof connection.client.destroy === 'function') {
        await connection.client.destroy();
      }
    } catch (error) {
      console.error(`Error closing connection ${connectionId}:`, error);
    }

    this.connections.delete(connectionId);
    console.log(`Removed connection ${connectionId}`);
  }

  private startMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
    }, 30000); // Update every 30 seconds
  }

  private updateMetrics(): void {
    this.metrics.totalConnections = this.connections.size;
    this.metrics.activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.inUse).length;
    this.metrics.idleConnections = Array.from(this.connections.values())
      .filter(conn => conn.isIdle && !conn.inUse).length;
    this.metrics.pendingAcquisitions = this.pendingAcquisitions.length;
    this.metrics.poolUtilization = this.config.maxConnections > 0 ? 
      (this.metrics.activeConnections / this.config.maxConnections) * 100 : 0;
  }

  private isRetryableError(error: any): boolean {
    // Define which errors are retryable
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'EPIPE',
      'ENOTFOUND',
      'timeout'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global pool instance
let globalPool: DatabaseConnectionPool | null = null;

/**
 * Get or create the global connection pool
 */
export function getConnectionPool(config?: Partial<ConnectionPoolConfig>): DatabaseConnectionPool {
  if (!globalPool) {
    globalPool = new DatabaseConnectionPool(config);
  }
  return globalPool;
}

/**
 * Execute a query using the global connection pool
 */
export async function pooledQuery<T = any>(
  queryFn: (client: any) => Promise<T>
): Promise<T> {
  const pool = getConnectionPool();
  return pool.query(queryFn);
}

/**
 * Get connection pool statistics
 */
export function getPoolStats(): PoolMetrics {
  const pool = getConnectionPool();
  return pool.getStats();
}

/**
 * Create a Supabase client wrapper with connection pooling
 */
export class PooledSupabaseClient {
  private pool: DatabaseConnectionPool;

  constructor(config?: Partial<ConnectionPoolConfig>) {
    this.pool = getConnectionPool(config);
  }

  /**
   * Execute a database query with connection pooling
   */
  async query<T = any>(queryFn: (supabase: any) => Promise<T>): Promise<T> {
    return this.pool.query(async (client) => {
      return await queryFn(client);
    });
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolMetrics {
    return this.pool.getStats();
  }

  /**
   * Get connection details
   */
  getConnectionDetails() {
    return this.pool.getConnectionDetails();
  }

  /**
   * Shutdown the pool
   */
  async destroy(): Promise<void> {
    await this.pool.destroy();
  }
}

/**
 * Connection pool monitoring and optimization
 */
export class ConnectionPoolMonitor {
  private pool: DatabaseConnectionPool;
  private metrics: Array<{ timestamp: number; stats: PoolMetrics }> = [];
  private alertThresholds = {
    highUtilization: 80, // percentage
    longAcquisitionTime: 1000, // milliseconds
    highErrorRate: 5 // percentage
  };

  constructor(pool: DatabaseConnectionPool) {
    this.pool = pool;
  }

  /**
   * Start monitoring the pool
   */
  startMonitoring(intervalMs: number = 30000): void {
    setInterval(() => {
      const stats = this.pool.getStats();
      this.metrics.push({
        timestamp: Date.now(),
        stats
      });

      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // Check for alerts
      this.checkAlerts(stats);
    }, intervalMs);
  }

  /**
   * Get performance insights
   */
  getInsights(): {
    averageUtilization: number;
    peakUtilization: number;
    averageAcquisitionTime: number;
    errorRate: number;
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        averageUtilization: 0,
        peakUtilization: 0,
        averageAcquisitionTime: 0,
        errorRate: 0,
        recommendations: []
      };
    }

    const recentMetrics = this.metrics.slice(-20); // Last 20 samples
    const avgUtilization = recentMetrics.reduce((sum, m) => sum + m.stats.poolUtilization, 0) / recentMetrics.length;
    const peakUtilization = Math.max(...recentMetrics.map(m => m.stats.poolUtilization));
    const avgAcquisitionTime = recentMetrics.reduce((sum, m) => sum + m.stats.connectionAcquisitionTime, 0) / recentMetrics.length;
    const errorRate = recentMetrics[recentMetrics.length - 1]?.stats.errorRate || 0;

    const recommendations: string[] = [];

    if (avgUtilization > 70) {
      recommendations.push('Consider increasing maxConnections - high average utilization detected');
    }

    if (peakUtilization > 95) {
      recommendations.push('Increase maxConnections - pool reaching capacity');
    }

    if (avgAcquisitionTime > 500) {
      recommendations.push('Connection acquisition time is high - consider optimizing queries or increasing pool size');
    }

    if (errorRate > 2) {
      recommendations.push('High error rate detected - check database health and network connectivity');
    }

    return {
      averageUtilization: Math.round(avgUtilization),
      peakUtilization: Math.round(peakUtilization),
      averageAcquisitionTime: Math.round(avgAcquisitionTime),
      errorRate: Math.round(errorRate * 100) / 100,
      recommendations
    };
  }

  private checkAlerts(stats: PoolMetrics): void {
    if (stats.poolUtilization > this.alertThresholds.highUtilization) {
      console.warn(`⚠️  High pool utilization: ${stats.poolUtilization.toFixed(1)}%`);
    }

    if (stats.connectionAcquisitionTime > this.alertThresholds.longAcquisitionTime) {
      console.warn(`⚠️  Long connection acquisition time: ${stats.connectionAcquisitionTime}ms`);
    }

    if (stats.errorRate > this.alertThresholds.highErrorRate) {
      console.warn(`⚠️  High error rate: ${stats.errorRate.toFixed(2)}%`);
    }
  }
}

// Export the connection pool class
export { DatabaseConnectionPool };

// Default export for convenience
export default {
  getConnectionPool,
  pooledQuery,
  getPoolStats,
  PooledSupabaseClient,
  ConnectionPoolMonitor,
  DatabaseConnectionPool
};