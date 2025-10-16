export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  shardCount: parseInt(process.env.SHARD_COUNT || '5', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  metricsEnabled: process.env.METRICS_ENABLED === 'true',
};

