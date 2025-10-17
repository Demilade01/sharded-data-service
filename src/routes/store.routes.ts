import { Router, Request, Response } from 'express';
import { shardManager } from '../services/ShardManager';
import { StoreRequest } from '../types';
import {
  httpRequestsTotal,
  shardRequestsTotal,
  storeOperationSuccess,
  storeOperationFailure,
  httpRequestDuration,
} from '../metrics';

export const storeRouter = Router();

/**
 * POST /api/store
 * Store data with userId
 */
// @ts-ignore
storeRouter.post('/store', (req: Request, res: Response) => {
  const end = httpRequestDuration.startTimer();

  try {
    const { userId, data }: StoreRequest = req.body;

    // Validation
    if (!userId) {
      httpRequestsTotal.inc({ method: 'POST', route: '/api/store', status: '400' });
      end({ method: 'POST', route: '/api/store', status: '400' });
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    if (data === undefined) {
      httpRequestsTotal.inc({ method: 'POST', route: '/api/store', status: '400' });
      end({ method: 'POST', route: '/api/store', status: '400' });
      return res.status(400).json({
        success: false,
        error: 'data is required',
      });
    }

    // Store data and get shard ID
    const shardId = shardManager.store(userId, data);

    // Update metrics
    shardRequestsTotal.inc({ shard_id: shardId.toString() });
    storeOperationSuccess.inc();
    httpRequestsTotal.inc({ method: 'POST', route: '/api/store', status: '201' });
    end({ method: 'POST', route: '/api/store', status: '201' });

    res.status(201).json({
      success: true,
      message: 'Data stored successfully',
      shardId,
      userId,
    });
  } catch (error) {
    storeOperationFailure.inc();
    httpRequestsTotal.inc({ method: 'POST', route: '/api/store', status: '500' });
    end({ method: 'POST', route: '/api/store', status: '500' });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/data/:userId
 * Retrieve data by userId
 */
// @ts-ignore
storeRouter.get('/data/:userId', (req: Request, res: Response) => {
  const end = httpRequestDuration.startTimer();

  try {
    const { userId } = req.params;

    const data = shardManager.get(userId);

    if (!data) {
      httpRequestsTotal.inc({ method: 'GET', route: '/api/data/:userId', status: '404' });
      end({ method: 'GET', route: '/api/data/:userId', status: '404' });

      return res.status(404).json({
        success: false,
        error: 'Data not found for this userId',
      });
    }

    httpRequestsTotal.inc({ method: 'GET', route: '/api/data/:userId', status: '200' });
    end({ method: 'GET', route: '/api/data/:userId', status: '200' });

    res.status(200).json({
      success: true,
      userId: data.userId,
      data: data.data,
      timestamp: data.timestamp,
      shardId: shardManager.findShardForUser(userId),
    });
  } catch (error) {
    httpRequestsTotal.inc({ method: 'GET', route: '/api/data/:userId', status: '500' });
    end({ method: 'GET', route: '/api/data/:userId', status: '500' });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

