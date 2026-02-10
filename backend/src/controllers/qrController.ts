import { Request, Response } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { Types } from 'mongoose';
import { config } from '../config/index.js';
import { Tenant } from '../models/index.js';

/**
 * Generate HMAC signature for magic link
 */
function generateSignature(tenantId: string, orderId: string, amount?: number): string {
    const data = `${tenantId}:${orderId}:${amount || ''}`;
    return crypto.createHmac('sha256', config.hmacSecret).update(data).digest('hex').substring(0, 16);
}

/**
 * Verify HMAC signature
 */
export function verifySignature(
    tenantId: string,
    orderId: string,
    signature: string,
    amount?: number
): boolean {
    const expected = generateSignature(tenantId, orderId, amount);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * GET /api/v1/qr/generate
 * Generate QR code for feedback form
 */
export const generateQR = async (req: Request, res: Response): Promise<void> => {
    try {
        const tenantId = req.query.tenantId as string;
        const orderId = req.query.orderId as string | undefined;
        const amount = req.query.amount ? parseFloat(req.query.amount as string) : undefined;

        if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
            res.status(400).json({
                success: false,
                error: 'Valid tenant ID is required',
            });
            return;
        }

        // Verify tenant exists
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found',
            });
            return;
        }

        // Build URL
        const baseUrl = config.frontendUrl;
        const params = new URLSearchParams();
        params.set('t', tenantId);

        // Static QR (no orderId) vs Magic QR (with orderId)
        if (orderId) {
            params.set('o', orderId);
            params.set('src', 'qr_magic');
            if (amount) {
                params.set('amt', amount.toString());
            }
            // Add signature for magic links
            const sig = generateSignature(tenantId, orderId, amount);
            params.set('sig', sig);
        } else {
            params.set('src', 'qr_static');
        }

        const feedbackUrl = `${baseUrl}/rate?${params.toString()}`;

        // Generate QR code as base64
        const qrCodeBase64 = await QRCode.toDataURL(feedbackUrl, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
        });

        res.json({
            success: true,
            data: {
                url: feedbackUrl,
                qrCode: qrCodeBase64,
                type: orderId ? 'magic' : 'static',
                tenant: {
                    id: tenant._id,
                    name: tenant.name,
                },
            },
        });
    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate QR code',
        });
    }
};

/**
 * GET /api/v1/qr/verify
 * Verify QR code signature
 */
export const verifyQR = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId, orderId, signature, amount } = req.query as {
            tenantId: string;
            orderId: string;
            signature: string;
            amount?: string;
        };

        if (!tenantId || !orderId || !signature) {
            res.status(400).json({
                success: false,
                error: 'Missing required parameters',
            });
            return;
        }

        const parsedAmount = amount ? parseFloat(amount) : undefined;
        const isValid = verifySignature(tenantId, orderId, signature, parsedAmount);

        res.json({
            success: true,
            data: {
                valid: isValid,
            },
        });
    } catch (error) {
        console.error('QR verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify QR code',
        });
    }
};
