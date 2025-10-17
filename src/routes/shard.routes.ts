import { Router, Request, Response } from 'express';
import { shardManager } from '../services/ShardManager';
import { httpRequestsTotal, httpRequestDuration, updateShardMetrics } from '../metrics';

export const shardRouter = Router();

/**
 * GET /api/shard/:shardId
 * Get all data in a specific shard
 */
// @ts-ignore
shardRouter.get('/shard/:shardId', (req: Request, res: Response) => {
  const end = httpRequestDuration.startTimer();

  try {
    const shardId = parseInt(req.params.shardId, 10);

    if (isNaN(shardId)) {
      httpRequestsTotal.inc({ method: 'GET', route: '/api/shard/:shardId', status: '400' });
      end({ method: 'GET', route: '/api/shard/:shardId', status: '400' });

      return res.status(400).json({
        success: false,
        error: 'Invalid shard ID',
      });
    }

    const shardData = shardManager.getShardData(shardId);

    httpRequestsTotal.inc({ method: 'GET', route: '/api/shard/:shardId', status: '200' });
    end({ method: 'GET', route: '/api/shard/:shardId', status: '200' });

    res.status(200).json({
      success: true,
      shardId,
      recordCount: shardData.length,
      data: shardData,
    });
  } catch (error: any) {
    httpRequestsTotal.inc({ method: 'GET', route: '/api/shard/:shardId', status: '500' });
    end({ method: 'GET', route: '/api/shard/:shardId', status: '500' });

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/stats
 * Get statistics about shard distribution
 */
// @ts-ignore
shardRouter.get('/stats', (req: Request, res: Response) => {
  const end = httpRequestDuration.startTimer();

  try {
    const stats = shardManager.getStats();

    // Update Prometheus metrics
    updateShardMetrics(stats.shardDistribution);

    httpRequestsTotal.inc({ method: 'GET', route: '/api/stats', status: '200' });
    end({ method: 'GET', route: '/api/stats', status: '200' });

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    httpRequestsTotal.inc({ method: 'GET', route: '/api/stats', status: '500' });
    end({ method: 'GET', route: '/api/stats', status: '500' });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/user/:userId/shard
 * Find which shard contains a specific userId
 */
shardRouter.get('/user/:userId/shard', (req: Request, res: Response) => {
  const end = httpRequestDuration.startTimer();

  try {
    const { userId } = req.params;
    const shardId = shardManager.findShardForUser(userId);

    httpRequestsTotal.inc({ method: 'GET', route: '/api/user/:userId/shard', status: '200' });
    end({ method: 'GET', route: '/api/user/:userId/shard', status: '200' });

    res.status(200).json({
      success: true,
      userId,
      shardId,
      totalShards: shardManager.getShardCount(),
    });
  } catch (error) {
    httpRequestsTotal.inc({ method: 'GET', route: '/api/user/:userId/shard', status: '500' });
    end({ method: 'GET', route: '/api/user/:userId/shard', status: '500' });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

