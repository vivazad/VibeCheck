import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware for production
 * Adds various security headers to protect against common attacks
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Prevent DNS prefetching abuse
    res.setHeader('X-DNS-Prefetch-Control', 'off');

    // Remove powered by header
    res.removeHeader('X-Powered-By');

    // HSTS (only for HTTPS)
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
}

/**
 * Request ID middleware for tracing
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
    const id = req.headers['x-request-id'] as string || generateRequestId();
    req.headers['x-request-id'] = id;
    res.setHeader('X-Request-ID', id);
    next();
}

function generateRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Global error handler middleware
 */
export function errorHandler(err: Error & { status?: number; code?: string }, req: Request, res: Response, _next: NextFunction): void {
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' && status === 500
        ? 'Internal Server Error'
        : err.message;

    // Log error details
    console.error({
        error: {
            message: err.message,
            stack: err.stack,
            code: err.code,
        },
        request: {
            id: req.headers['x-request-id'],
            method: req.method,
            url: req.url,
            userAgent: req.headers['user-agent'],
        },
    });

    res.status(status).json({
        success: false,
        error: {
            message,
            code: err.code || 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        },
        requestId: req.headers['x-request-id'],
    });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            code: 'NOT_FOUND',
        },
        requestId: req.headers['x-request-id'],
    });
}
