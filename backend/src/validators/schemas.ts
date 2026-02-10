import { z } from 'zod';

// Submission validation schema
export const answerSchema = z.object({
    questionId: z.string().min(1),
    value: z.union([z.number(), z.string()]),
});

export const customerMetadataSchema = z.object({
    phone: z.string().optional(),
    orderId: z.string().optional(),
    storeId: z.string().optional(),
    source: z.enum(['qr_static', 'qr_magic']).default('qr_static'),
});

export const submitFormSchema = z.object({
    tenantId: z.string().min(1, 'Tenant ID is required'),
    formId: z.string().optional(),
    answers: z.array(answerSchema).min(1, 'At least one answer is required'),
    metadata: customerMetadataSchema.optional().default({}),
    honeypot: z.string().optional(), // Should be empty - abuse detection
});

export type SubmitFormInput = z.infer<typeof submitFormSchema>;

// Analytics query validation
export const analyticsQuerySchema = z.object({
    range: z.enum(['7d', '30d', '90d']).default('30d'),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

// QR generation validation
export const qrGenerateSchema = z.object({
    tenantId: z.string().min(1, 'Tenant ID is required'),
    orderId: z.string().optional(),
    amount: z.coerce.number().positive().optional(),
});

export type QRGenerateInput = z.infer<typeof qrGenerateSchema>;

// Auth validation schemas
export const loginSchema = z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
