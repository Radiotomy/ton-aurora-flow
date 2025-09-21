import { useCallback, useRef } from 'react';

interface BatchRequest {
  id: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

interface BatchConfig {
  maxBatchSize: number;
  batchTimeoutMs: number;
  maxConcurrentBatches: number;
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 5,
  batchTimeoutMs: 100,
  maxConcurrentBatches: 3,
};

class RequestBatcher {
  private pendingRequests = new Map<string, BatchRequest[]>();
  private batchTimeouts = new Map<string, NodeJS.Timeout>();
  private activeBatches = new Set<string>();
  private requestCount = 0;
  private successCount = 0;
  private errorCount = 0;

  constructor(private config: BatchConfig = DEFAULT_BATCH_CONFIG) {}

  async addRequest<T>(
    batchKey: string,
    requestId: string,
    executor: (requests: string[]) => Promise<Map<string, T>>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Add request to batch
      if (!this.pendingRequests.has(batchKey)) {
        this.pendingRequests.set(batchKey, []);
      }

      const batch = this.pendingRequests.get(batchKey)!;
      batch.push({ id: requestId, resolve, reject });

      this.requestCount++;

      // Check if we should execute immediately
      if (batch.length >= this.config.maxBatchSize) {
        this.executeBatch(batchKey, executor);
      } else {
        // Set timeout if not already set
        if (!this.batchTimeouts.has(batchKey)) {
          const timeout = setTimeout(() => {
            this.executeBatch(batchKey, executor);
          }, this.config.batchTimeoutMs);
          this.batchTimeouts.set(batchKey, timeout);
        }
      }
    });
  }

  private async executeBatch<T>(
    batchKey: string,
    executor: (requests: string[]) => Promise<Map<string, T>>
  ) {
    // Check concurrent batch limit
    if (this.activeBatches.size >= this.config.maxConcurrentBatches) {
      // Delay execution
      setTimeout(() => this.executeBatch(batchKey, executor), 50);
      return;
    }

    const batch = this.pendingRequests.get(batchKey);
    if (!batch || batch.length === 0) return;

    // Clear batch and timeout
    this.pendingRequests.delete(batchKey);
    const timeout = this.batchTimeouts.get(batchKey);
    if (timeout) {
      clearTimeout(timeout);
      this.batchTimeouts.delete(batchKey);
    }

    this.activeBatches.add(batchKey);

    try {
      const requestIds = batch.map(req => req.id);
      const results = await executor(requestIds);

      // Resolve individual requests
      batch.forEach(request => {
        const result = results.get(request.id);
        if (result !== undefined) {
          request.resolve(result);
          this.successCount++;
        } else {
          request.reject(new Error(`No result for request ${request.id}`));
          this.errorCount++;
        }
      });
    } catch (error) {
      // Reject all requests in batch
      batch.forEach(request => {
        request.reject(error);
        this.errorCount++;
      });
    } finally {
      this.activeBatches.delete(batchKey);
    }
  }

  getStats() {
    return {
      pendingBatches: this.pendingRequests.size,
      activeBatches: this.activeBatches.size,
      totalRequests: this.requestCount,
      successCount: this.successCount,
      errorCount: this.errorCount,
      pendingRequests: Array.from(this.pendingRequests.entries()).reduce(
        (acc, [key, batch]) => {
          acc[key] = batch.length;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  clear() {
    // Clear all timeouts
    this.batchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.batchTimeouts.clear();
    
    // Reject all pending requests
    this.pendingRequests.forEach(batch => {
      batch.forEach(request => {
        request.reject(new Error('Batch cleared'));
      });
    });
    this.pendingRequests.clear();
    this.activeBatches.clear();
  }
}

const requestBatcher = new RequestBatcher();

export const useRequestBatcher = (config?: Partial<BatchConfig>) => {
  const batcherRef = useRef(config ? new RequestBatcher({ ...DEFAULT_BATCH_CONFIG, ...config }) : requestBatcher);

  const batchRequest = useCallback(async <T>(
    batchKey: string,
    requestId: string,
    executor: (requests: string[]) => Promise<Map<string, T>>
  ): Promise<T> => {
    return batcherRef.current.addRequest(batchKey, requestId, executor);
  }, []);

  const getStats = useCallback(() => {
    return batcherRef.current.getStats();
  }, []);

  const clearBatches = useCallback(() => {
    batcherRef.current.clear();
  }, []);

  return {
    batchRequest,
    getStats,
    clearBatches,
  };
};