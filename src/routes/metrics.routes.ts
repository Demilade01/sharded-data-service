import { Router, Request, Response } from 'express';
import { register } from '../metrics';

export const metricsRouter = Router();

/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
metricsRouter.get('/', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
    });
  }
});

