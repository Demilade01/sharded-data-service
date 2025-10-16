import { Registry, Counter, Gauge, Histogram } from 'prom-client';
import { config } from '../config';

// Create a custom registry
export const register = new Registry();

// Metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const shardRequestsTotal = new Counter({
  name: 'shard_requests_total',
  help: 'Total number of requests per shard',
  labelNames: ['shard_id'],
  registers: [register],
});

export const shardDistributionGauge = new Gauge({
  name: 'shard_distribution',
  help: 'Number of records in each shard',
  labelNames: ['shard_id'],
  registers: [register],
});

export const totalRecordsGauge = new Gauge({
  name: 'total_records',
  help: 'Total number of records stored across all shards',
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const storeOperationSuccess = new Counter({
  name: 'store_operation_success_total',
  help: 'Total number of successful store operations',
  registers: [register],
});

export const storeOperationFailure = new Counter({
  name: 'store_operation_failure_total',
  help: 'Total number of failed store operations',
  registers: [register],
});

/**
 * Initialize metrics
 */
export function setupMetrics(): void {
  // Set default metrics
  register.setDefaultLabels({
    app: 'sharded-data-service',
    shard_count: config.shardCount.toString(),
  });

  console.log('✅ Prometheus metrics initialized');
}

/**
 * Update shard distribution metrics
 */
export function updateShardMetrics(shardStats: { shardId: number; dataCount: number }[]): void {
  let totalRecords = 0;

  shardStats.forEach(({ shardId, dataCount }) => {
    shardDistributionGauge.set({ shard_id: shardId.toString() }, dataCount);
    totalRecords += dataCount;
  });

  totalRecordsGauge.set(totalRecords);
}

