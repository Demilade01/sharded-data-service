import { Router, Request, Response } from 'express';
import { shardManager } from '../services/ShardManager';

export const healthRouter = Router();

/**
 * GET /health
 * Health check endpoint
 */
// @ts-ignore
healthRouter.get('/', (req: Request, res: Response) => {
  const stats = shardManager.getStats();

  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    shards: {
      total: stats.totalShards,
      totalRecords: stats.totalRecords,
    },
  });
});

