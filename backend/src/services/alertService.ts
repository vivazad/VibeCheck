import axios, { AxiosError } from 'axios';
import { config } from '../config/index.js';
import { ITenant, IResponse } from '../models/index.js';
import logger from '../utils/logger.js';

interface AlertPayload {
    tenantId: string;
    tenantName: string;
    customerPhone?: string;
    orderId?: string;
    npsScore: number;
    submittedAt: Date;
}

interface RetryOptions {
    maxRetries: number;
    delayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 2,
    delayMs: 1000,
};

/**
 * Utility: Sleep for a specified duration
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Utility: Execute an async function with retry logic
 * Fire-and-forget style - logs failures but never throws
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    context: { service: string; tenantId: string; responseId?: string },
    options: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            const isAxiosError = (error as AxiosError).isAxiosError;
            const statusCode = isAxiosError ? (error as AxiosError).response?.status : undefined;

            logger.warn({
                tag: '[ALERT_RETRY]',
                service: context.service,
                tenantId: context.tenantId,
                responseId: context.responseId,
                attempt,
                maxRetries: options.maxRetries + 1,
                statusCode,
                error: lastError.message,
            }, `[ALERT_RETRY] ${context.service} attempt ${attempt}/${options.maxRetries + 1} failed`);

            // Don't retry on 4xx client errors (except 429 rate limit)
            if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
                break;
            }

            // Don't wait after the last attempt
            if (attempt < options.maxRetries + 1) {
                await sleep(options.delayMs * attempt); // Exponential backoff
            }
        }
    }

    // All retries exhausted - log with [ALERT_FAILED] tag
    logger.error({
        tag: '[ALERT_FAILED]',
        service: context.service,
        tenantId: context.tenantId,
        responseId: context.responseId,
        error: lastError?.message,
        stack: lastError?.stack,
    }, `[ALERT_FAILED] ${context.service} failed after ${options.maxRetries + 1} attempts`);

    return null;
}

/**
 * Send WhatsApp alert for low NPS scores (detractors)
 * Fire-and-forget: Returns immediately, logs failures with [ALERT_FAILED] tag
 */
export async function sendWhatsAppAlert(
    tenant: ITenant,
    response: IResponse
): Promise<boolean> {
    const payload: AlertPayload = {
        tenantId: tenant._id.toString(),
        tenantName: tenant.name,
        customerPhone: response.customer.phone,
        orderId: response.customer.orderId,
        npsScore: response.metrics.npsScore || 0,
        submittedAt: response.submittedAt,
    };

    logger.info({
        tag: '[ALERT_TRIGGERED]',
        tenantId: payload.tenantId,
        npsScore: payload.npsScore,
        orderId: payload.orderId,
    }, `[ALERT_TRIGGERED] Low NPS alert for ${payload.tenantName}`);

    // In development, just log and return success
    if (config.nodeEnv !== 'production') {
        logger.debug({
            tag: '[ALERT_DEV]',
            payload,
        }, '[ALERT_DEV] WhatsApp alert would be sent in production');
        return true;
    }

    // Production: Send actual WhatsApp message with retry
    const result = await withRetry(
        async () => {
            await axios.post(
                config.whatsappApiUrl,
                {
                    to: tenant.ownerPhone,
                    type: 'template',
                    template: {
                        name: 'low_nps_alert',
                        language: { code: 'en' },
                        components: [
                            {
                                type: 'body',
                                parameters: [
                                    { type: 'text', text: payload.tenantName },
                                    { type: 'text', text: payload.npsScore.toString() },
                                    { type: 'text', text: payload.orderId || 'N/A' },
                                    { type: 'text', text: payload.customerPhone || 'Anonymous' },
                                ],
                            },
                        ],
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${config.whatsappApiToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // 10 second timeout
                }
            );
            return true;
        },
        {
            service: 'WhatsApp',
            tenantId: payload.tenantId,
            responseId: response._id.toString(),
        }
    );

    if (result) {
        logger.info({
            tag: '[ALERT_SUCCESS]',
            service: 'WhatsApp',
            tenantId: payload.tenantId,
        }, '[ALERT_SUCCESS] WhatsApp alert sent successfully');
    }

    return result !== null;
}

/**
 * Send webhook notification if configured
 * Fire-and-forget: Returns immediately, logs failures with [ALERT_FAILED] tag
 */
export async function sendWebhookNotification(
    tenant: ITenant,
    response: IResponse
): Promise<boolean> {
    if (!tenant.webhookUrl) return false;

    const tenantId = tenant._id.toString();
    const responseId = response._id.toString();

    const result = await withRetry(
        async () => {
            await axios.post(
                tenant.webhookUrl!,
                {
                    event: 'new_response',
                    tenantId,
                    response: {
                        id: responseId,
                        metrics: response.metrics,
                        customer: response.customer,
                        submittedAt: response.submittedAt,
                    },
                },
                {
                    timeout: 10000, // 10 second timeout
                }
            );
            return true;
        },
        {
            service: 'Webhook',
            tenantId,
            responseId,
        }
    );

    if (result) {
        logger.info({
            tag: '[ALERT_SUCCESS]',
            service: 'Webhook',
            tenantId,
            webhookUrl: tenant.webhookUrl,
        }, `[ALERT_SUCCESS] Webhook sent to ${tenant.webhookUrl}`);
    }

    return result !== null;
}

/**
 * Determine if an alert should be triggered based on NPS score
 */
export function shouldTriggerAlert(npsScore: number, threshold: number = 5): boolean {
    return npsScore < threshold;
}

/**
 * Format an alert message for display/logging
 */
export function formatAlertMessage(data: {
    tenantName: string;
    npsScore: number;
    orderId?: string;
    feedback?: string;
}): string {
    const { tenantName, npsScore, orderId, feedback } = data;

    let message = `🚨 Low NPS Alert - ${tenantName}\n`;
    message += `Score: ${npsScore}/10\n`;

    if (orderId) {
        message += `Order: ${orderId}\n`;
    }

    if (feedback) {
        // Truncate long feedback
        const truncated = feedback.length > 200 ? feedback.substring(0, 197) + '...' : feedback;
        message += `Feedback: ${truncated}`;
    }

    return message;
}
