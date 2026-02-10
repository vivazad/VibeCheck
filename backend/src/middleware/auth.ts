import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthPayload {
    userId: string;
    role: string;
    tenantId?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
            tenant?: { tenantId: string }; // Keep for backward compatibility
        }
    }
}

/**
 * JWT Authentication middleware
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Check Cookies
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'No authentication token provided',
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
        req.user = decoded;

        // Backward compatibility for existing controllers using req.tenant
        if (decoded.tenantId) {
            req.tenant = { tenantId: decoded.tenantId };
        }

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Insufficient permissions',
            });
            return;
        }
        next();
    };
};
