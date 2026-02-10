import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// In-memory store for order-based rate limiting
const orderSubmissions = new Map<string, number>();

// Clean up old entries every hour
setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, timestamp] of orderSubmissions.entries()) {
        if (timestamp < oneHourAgo) {
            orderSubmissions.delete(key);
        }
    }
}, 60 * 60 * 1000);

/**
 * Rate limiter by OrderID - allows only 1 submission per OrderID
 */
export const orderRateLimiter = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const orderId = req.body?.metadata?.orderId;

    // If no orderId (anonymous submission), allow with standard rate limiting
    if (!orderId) {
        return next();
    }

    const key = `${req.body.tenantId}:${orderId}`;

    if (orderSubmissions.has(key)) {
        res.status(429).json({
            success: false,
            error: 'Duplicate submission',
            message: 'A response has already been submitted for this order.',
        });
        return;
    }

    // Mark this order as submitted
    orderSubmissions.set(key, Date.now());
    next();
};

/**
 * General API rate limiter - 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Stricter rate limiter for submission endpoint - 10 per hour per IP
 */
export const submitRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        success: false,
        error: 'Submission limit reached',
        message: 'Too many submissions. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
