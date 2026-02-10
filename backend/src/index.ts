import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { config } from './config/index.js';
import { apiRateLimiter } from './middleware/index.js';
import { securityHeaders, requestId, errorHandler, notFoundHandler } from './middleware/security.js';
import { requestLogger } from './utils/logger.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import healthRoutes from './routes/healthRoutes.js';
import path from 'path';

// Environment variables loaded via import 'dotenv/config'

const app = express();

// Serve uploads statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(requestId);
app.use(securityHeaders);

// Request logging (production)
if (config.nodeEnv === 'production') {
    app.use(requestLogger());
}

// CORS configuration
app.use(cors({
    origin: config.nodeEnv === 'production'
        ? config.frontendUrl
        : ['http://localhost:5173', 'http://localhost:3000', config.frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Rate limiting
app.use(apiRateLimiter);

// Health check routes (before API routes, no rate limiting)
app.use(healthRoutes);

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
    logger.info({ signal }, `Received ${signal}, starting graceful shutdown`);

    server.close((err) => {
        if (err) {
            logger.error({ err }, 'Error during server close');
            process.exit(1);
        }
        logger.info('Server closed successfully');
        process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcing shutdown');
        process.exit(1);
    }, 30000);
};

// Start server
let server: ReturnType<typeof app.listen>;

const startServer = async () => {
    try {
        await connectDatabase();

        server = app.listen(config.port, () => {
            logger.info({
                port: config.port,
                environment: config.nodeEnv,
                frontendUrl: config.frontendUrl,
            }, `🚀 VibeCheck API running on port ${config.port}`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error({ error }, '❌ Failed to start server');
        process.exit(1);
    }
};

startServer();

export default app;

