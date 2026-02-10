import nodemailer from 'nodemailer';
import { ITask, ITenant } from '../models/index.js';
import logger from '../utils/logger.js';
import { config } from '../config/index.js';

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize Email Service (Nodemailer with Ethereal)
 */
export const initEmailService = async () => {
    try {
        if (transporter) return;

        // Use Ethereal for testing
        const testAccount = await nodemailer.createTestAccount();

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        logger.info({ user: testAccount.user }, '📧 Email Service initialized (Ethereal)');
    } catch (error) {
        logger.error({ error }, '❌ Failed to initialize Email Service');
    }
};

/**
 * Send an email alert for a new task
 */
export const sendTaskAlert = async (task: ITask, tenant: ITenant, recipientEmail: string) => {
    try {
        if (!transporter) {
            await initEmailService();
        }

        if (!transporter) {
            throw new Error('Email transporter not initialized');
        }

        const dashboardUrl = config.frontendUrl || 'http://localhost:5173';
        const resolveLink = `${dashboardUrl}/api/tasks/${task._id}/quick-resolve?action=fixed`; // This should conceptually likely check backend for logic or frontend page? 
        // Request says: "Links to GET /api/tasks/:id/quick-resolve?action=fixed". 
        // This effectively is an API link. But users clicking email links usually expect a page or a direct action.
        // We will adhere to the prompt.
        const apiUrl = `http://localhost:${config.port}/api/v1`; // Backend URL
        const resolveApiLink = `${apiUrl}/tasks/${task._id}/quick-resolve?action=fixed`;
        const contactLink = `${apiUrl}/tasks/${task._id}/contact`;

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px;">
                <h2 style="color: #ef4444;">🚨 Action Required: Negative Feedback</h2>
                <p><strong>Store:</strong> ${tenant.name}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p>A customer just submitted negative feedback. A task has been created for you.</p>
                
                <div style="background: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p><strong>Response ID:</strong> ${task.responseId}</p>
                    <p><strong>Status:</strong> ${task.status}</p>
                    <p><strong>SLA Breach:</strong> ${new Date(task.slaBreachAt).toLocaleString()}</p>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <a href="${resolveApiLink}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Mark Resolved</a>
                    <a href="${contactLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Contact Customer</a>
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                    Task ID: ${task._id}
                </p>
            </div>
        `;

        const info = await transporter.sendMail({
            from: '"VibeCheck Ops" <ops@vibecheck.com>',
            to: recipientEmail,
            subject: `🚨 New Task: Low Feedback from ${tenant.name}`,
            text: `New Task Created. ID: ${task._id}. Priority: ${task.priority}. Please check dashboard.`,
            html: html,
        });

        logger.info({
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info),
            recipient: recipientEmail
        }, '📧 Task Alert Email Sent');

        // Log Preview URL to console for dev visibility
        console.log('📬 Email Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return info;

    } catch (error) {
        logger.error({ error, taskId: task._id }, '❌ Failed to send task email');
    }
};
