import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Form, Response as ResponseModel, Tenant } from '../models/index.js';
import { calculateMetrics, shouldTriggerAlert, sendWhatsAppAlert, sendWebhookNotification, TaskService } from '../services/index.js';
import { SubmitFormInput } from '../validators/index.js';

/**
 * POST /api/v1/submit
 * Submit form response with NPS/CSAT calculation
 */
export const submitForm = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId, formId, answers, metadata, honeypot } = req.body as SubmitFormInput;

        // Honeypot check - reject if filled (bot detection)
        if (honeypot && honeypot.trim() !== '') {
            console.log('🤖 Bot detected via honeypot');
            // Return success to not reveal detection
            res.status(200).json({
                success: true,
                message: 'Thank you for your feedback!',
            });
            return;
        }

        // Validate tenant exists
        if (!Types.ObjectId.isValid(tenantId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid tenant ID',
            });
            return;
        }

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found',
            });
            return;
        }

        // Get form (use provided formId or find active form)
        let form;
        if (formId && Types.ObjectId.isValid(formId)) {
            form = await Form.findById(formId);
        } else {
            form = await Form.findOne({ tenantId, active: true });
        }

        if (!form) {
            res.status(404).json({
                success: false,
                error: 'No active form found for this tenant',
            });
            return;
        }

        // Calculate metrics
        const metrics = calculateMetrics(answers, form.fields);

        // Determine source based on presence of orderId
        const source = metadata?.orderId ? 'qr_magic' : 'qr_static';

        // Create response document
        const responseDoc = new ResponseModel({
            tenantId: new Types.ObjectId(tenantId),
            formId: form._id,
            customer: {
                phone: metadata?.phone,
                orderId: metadata?.orderId,
                storeId: metadata?.storeId,
                source,
            },
            metrics,
            answers,
            submittedAt: new Date(),
        });

        await responseDoc.save();

        // Async: Check if alert should be triggered
        if (shouldTriggerAlert(metrics.npsScore, tenant.settings.alertThreshold)) {
            // Fire and forget - don't block response
            sendWhatsAppAlert(tenant, responseDoc).catch((err) => {
                console.error('Failed to send WhatsApp alert:', err);
            });
        }

        // Async: Create Task if negative feedback (NPS <= 6 or CSAT <= 2)
        TaskService.checkAndCreateTask(responseDoc, tenant).catch((err) => {
            console.error('Failed to create task:', err);
        });

        // Async: Send webhook notification if configured
        if (tenant.webhookUrl) {
            sendWebhookNotification(tenant, responseDoc).catch((err) => {
                console.error('Failed to send webhook:', err);
            });
        }

        res.status(201).json({
            success: true,
            message: 'Thank you for your feedback!',
            data: {
                responseId: responseDoc._id,
                metrics,
                tenant: {
                    name: tenant.name,
                    tipping: tenant.tipping,
                    themeConfig: tenant.themeConfig,
                },
            },
        });
    } catch (error) {
        console.error('Submit form error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit response',
        });
    }
};
