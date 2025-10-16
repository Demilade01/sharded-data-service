import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupMetrics } from './metrics';
import { storeRouter } from './routes/store.routes';
import { shardRouter } from './routes/shard.routes';
import { metricsRouter } from './routes/metrics.routes';
import { healthRouter } from './routes/health.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Prometheus metrics
setupMetrics();

// Routes
app.use('/api', storeRouter);
app.use('/api', shardRouter);
app.use('/metrics', metricsRouter);
app.use('/health', healthRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sharded Data Service running on port ${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`💚 Health check at http://localhost:${PORT}/health`);
});

export default app;

