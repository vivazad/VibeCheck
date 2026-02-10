import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware factory for Zod schemas
 */
export const validate = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
            const parsed = schema.parse(data);

            if (source === 'body') {
                req.body = parsed;
            } else if (source === 'query') {
                req.query = parsed as unknown as qs.ParsedQs;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation Error',
                    details: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
};

/**
 * Global error handler
 */
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('❌ Error:', err);

    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
};
