import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  errorRate: number;
  requestsPerSecond: number;
}

interface APICallRecord {
  timestamp: number;
  duration: number;
  endpoint: string;
  cached: boolean;
  success: boolean;
}

class PerformanceMonitor {
  private callHistory: APICallRecord[] = [];
  private readonly maxHistorySize = 1000;
  private startTime = Date.now();

  recordAPICall(endpoint: string, duration: number, cached: boolean, success: boolean) {
    const record: APICallRecord = {
      timestamp: Date.now(),
      duration,
      endpoint,
      cached,
      success,
    };

    this.callHistory.push(record);

    // Keep history size manageable
    if (this.callHistory.length > this.maxHistorySize) {
      this.callHistory = this.callHistory.slice(-this.maxHistorySize);
    }
  }

  getMetrics(timeWindowMs = 60000): PerformanceMetrics {
    const now = Date.now();
    const windowStart = now - timeWindowMs;
    const recentCalls = this.callHistory.filter(call => call.timestamp >= windowStart);

    if (recentCalls.length === 0) {
      return {
        apiCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageResponseTime: 0,
        errorRate: 0,
        requestsPerSecond: 0,
      };
    }

    const cacheHits = recentCalls.filter(call => call.cached).length;
    const cacheMisses = recentCalls.filter(call => !call.cached).length;
    const errors = recentCalls.filter(call => !call.success).length;
    const totalDuration = recentCalls.reduce((sum, call) => sum + call.duration, 0);
    const timeWindowSeconds = timeWindowMs / 1000;

    return {
      apiCalls: recentCalls.length,
      cacheHits,
      cacheMisses,
      averageResponseTime: totalDuration / recentCalls.length,
      errorRate: (errors / recentCalls.length) * 100,
      requestsPerSecond: recentCalls.length / timeWindowSeconds,
    };
  }

  getEndpointStats(timeWindowMs = 60000) {
    const now = Date.now();
    const windowStart = now - timeWindowMs;
    const recentCalls = this.callHistory.filter(call => call.timestamp >= windowStart);

    const endpointStats = recentCalls.reduce((stats, call) => {
      if (!stats[call.endpoint]) {
        stats[call.endpoint] = {
          calls: 0,
          cacheHits: 0,
          errors: 0,
          totalDuration: 0,
        };
      }

      stats[call.endpoint].calls++;
      if (call.cached) stats[call.endpoint].cacheHits++;
      if (!call.success) stats[call.endpoint].errors++;
      stats[call.endpoint].totalDuration += call.duration;

      return stats;
    }, {} as Record<string, { calls: number; cacheHits: number; errors: number; totalDuration: number }>);

    return Object.entries(endpointStats).map(([endpoint, stats]) => ({
      endpoint,
      calls: stats.calls,
      cacheHitRate: (stats.cacheHits / stats.calls) * 100,
      errorRate: (stats.errors / stats.calls) * 100,
      averageResponseTime: stats.totalDuration / stats.calls,
    }));
  }

  checkRateLimit(maxRequestsPerSecond = 20): { withinLimit: boolean; currentRPS: number; recommendation: string } {
    const metrics = this.getMetrics(1000); // Last second
    const currentRPS = metrics.requestsPerSecond;
    const withinLimit = currentRPS <= maxRequestsPerSecond;

    let recommendation = '';
    if (!withinLimit) {
      recommendation = 'Rate limit exceeded. Consider caching, request batching, or reducing polling frequency.';
    } else if (currentRPS > maxRequestsPerSecond * 0.8) {
      recommendation = 'Approaching rate limit. Consider optimization strategies.';
    }

    return {
      withinLimit,
      currentRPS,
      recommendation,
    };
  }

  clear() {
    this.callHistory = [];
    this.startTime = Date.now();
  }
}

const performanceMonitor = new PerformanceMonitor();

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  const recordAPICall = useCallback((
    endpoint: string,
    duration: number,
    cached: boolean,
    success: boolean
  ) => {
    performanceMonitor.recordAPICall(endpoint, duration, cached, success);
  }, []);

  const updateMetrics = useCallback(() => {
    setMetrics(performanceMonitor.getMetrics());
  }, []);

  const getRateLimitStatus = useCallback((maxRPS = 20) => {
    return performanceMonitor.checkRateLimit(maxRPS);
  }, []);

  const getEndpointStats = useCallback(() => {
    return performanceMonitor.getEndpointStats();
  }, []);

  useEffect(() => {
    // Update metrics every 5 seconds
    updateMetrics();
    updateIntervalRef.current = setInterval(updateMetrics, 5000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [updateMetrics]);

  return {
    metrics,
    recordAPICall,
    getRateLimitStatus,
    getEndpointStats,
    updateMetrics,
    clearMetrics: performanceMonitor.clear.bind(performanceMonitor),
  };
};
