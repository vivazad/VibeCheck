import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

    // Use pino-pretty in development
    transport: !isProduction ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    } : undefined,

    // Base fields for all logs
    base: {
        service: 'vibecheck-api',
        environment: process.env.NODE_ENV || 'development',
    },

    // Redact sensitive fields
    redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash'],
        censor: '[REDACTED]',
    },

    // Serializers for common objects
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            id: req.id,
            remoteAddress: req.remoteAddress,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
        err: pino.stdSerializers.err,
    },
});

// Express middleware for request logging
export function requestLogger() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (req: any, res: any, next: any) => {
        const start = Date.now();
        const requestId = req.headers['x-request-id'] || 'unknown';

        logger.info({
            type: 'request',
            requestId,
            method: req.method,
            url: req.url,
        }, `${req.method} ${req.url}`);

        res.on('finish', () => {
            const duration = Date.now() - start;
            const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

            logger[logLevel]({
                type: 'response',
                requestId,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration,
            }, `${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
        });

        next();
    };
}

export default logger;
