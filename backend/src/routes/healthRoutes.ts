import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    checks: {
        database: {
            status: 'up' | 'down';
            latency?: number;
        };
        memory: {
            status: 'ok' | 'warning' | 'critical';
            used: number;
            total: number;
            percentage: number;
        };
    };
}

/**
 * Basic health check - returns 200 if server is running
 * Used by load balancers and container orchestration
 */
router.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});

/**
 * Detailed health check with dependency status
 * Used for monitoring and debugging
 */
router.get('/health/detailed', async (_req: Request, res: Response) => {
    const startTime = Date.now();

    // Check database connection
    let dbStatus: 'up' | 'down' = 'down';
    let dbLatency = 0;

    try {
        const dbStart = Date.now();
        await mongoose.connection.db?.admin().ping();
        dbLatency = Date.now() - dbStart;
        dbStatus = 'up';
    } catch {
        dbStatus = 'down';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    let memStatus: 'ok' | 'warning' | 'critical' = 'ok';
    if (memPercentage > 90) memStatus = 'critical';
    else if (memPercentage > 75) memStatus = 'warning';

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (dbStatus === 'down') overallStatus = 'unhealthy';
    else if (memStatus === 'critical') overallStatus = 'degraded';

    const health: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        checks: {
            database: {
                status: dbStatus,
                latency: dbLatency,
            },
            memory: {
                status: memStatus,
                used: memUsedMB,
                total: memTotalMB,
                percentage: memPercentage,
            },
        },
    };

    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(health);
});

/**
 * Liveness probe - is the process alive?
 */
router.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'alive' });
});

/**
 * Readiness probe - is the service ready to accept traffic?
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
    try {
        // Check if DB is connected
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not connected');
        }
        res.status(200).json({ status: 'ready' });
    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
