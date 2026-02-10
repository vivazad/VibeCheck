import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService.js';
import { TaskStatus } from '../models/index.js';
import { Types } from 'mongoose';

/**
 * GET /api/v1/tasks
 * List tasks for the authenticated tenant
 */
export const getTasks = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID missing' });
        }

        const { status, priority, locationId } = req.query;

        const filters: any = {};
        if (status) filters.status = status;
        if (priority) filters.priority = priority;
        if (locationId) filters.locationId = locationId;

        const tasks = await TaskService.getTasks(tenantId, filters);

        res.json({
            success: true,
            data: tasks,
        });
    } catch (error) {
        console.error('Get Tasks Error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};


/**
 * POST /api/v1/tasks/:id/resolve
 * Mark task as resolved with optional proof/note
 */
export const resolveTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { note, proofUrl } = req.body;
        const userId = (req as any).user.userId;
        const tenantId = (req as any).user.tenantId;
        const userEmail = (req as any).user.email || 'Admin';

        // 1. Fetch Tenant Settings for Governance
        const tenant = await import('../models/index.js').then(m => m.Tenant.findById(tenantId));
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

        const config = tenant.settings.taskConfig;

        // 2. Validate Conditional Logic
        if (config.requireResolutionNote && !note) {
            return res.status(400).json({
                error: 'Resolution note is required by organization policy.'
            });
        }

        if (config.requireResolutionProof && !proofUrl) {
            return res.status(400).json({
                error: 'Photo evidence is required to resolve this task.'
            });
        }

        const task = await TaskService.resolveTask(id, userEmail, note, proofUrl);

        res.json({
            success: true,
            data: task,
        });
    } catch (error) {
        console.error('Resolve Task Error:', error);
        res.status(500).json({ error: 'Failed to resolve task' });
    }
};

/**
 * POST /api/v1/tasks/:id/reassign
 * Transfer task to another user
 */
export const reassignTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newEmail, newDueDate, reason } = req.body;
        const userEmail = (req as any).user.email || 'Admin';

        if (!newEmail) {
            return res.status(400).json({ error: 'New assignee email is required' });
        }

        const task = await TaskService.reassignTask(
            id,
            newEmail,
            userEmail,
            newDueDate ? new Date(newDueDate) : undefined,
            reason
        );

        res.json({
            success: true,
            data: task,
        });
    } catch (error) {
        console.error('Reassign Task Error:', error);
        res.status(500).json({ error: 'Failed to reassign task' });
    }
};

/**
 * GET /api/v1/tasks/:id/quick-resolve
 * Quick link handler (magic link)
 */
export const quickResolve = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action } = req.query;

        if (action !== 'fixed') {
            return res.status(400).send('Invalid action');
        }

        await TaskService.resolveTask(id, 'Quick Link (Manager)');

        res.send(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #10b981;">Task Resolved!</h1>
                    <p>Thank you for taking quick action.</p>
                </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('Failed to update task');
    }
};
