import { Types } from 'mongoose';
import { IResponse, ITenant, Task, ITask, TaskStatus, TaskPriority, Store } from '../models/index.js';
import { sendTaskAlert } from './EmailService.js';
import logger from '../utils/logger.js';

export class TaskService {
    /**
     * Check feedback and automatically create a task if thresholds are met
     */
    static async checkAndCreateTask(response: IResponse, tenant: ITenant): Promise<ITask | null> {
        const { metrics, customer, tenantId, _id: responseId } = response;
        const nps = metrics.npsScore || 10; // Default high if missing
        const csat = metrics.csatScore || 5;

        // Condition provided: NPS <= 6 OR CSAT <= 2
        // Note: NPS 0-6 is Detractor. CSAT usually 1-2 is Dissatisfied.
        if (nps > 6 && csat > 2) {
            return null; // No task needed
        }

        logger.info({ tenantId, responseId, nps, csat }, '📉 Negative feedback detected. Initiating Task.');

        try {
            // Determine Location and Assignee
            let locationId: Types.ObjectId | undefined;
            let assignedTo = tenant.ownerEmail; // Default to owner
            let storeName = 'Default Location';

            if (customer.storeId) {
                const store = await Store.findById(customer.storeId);
                if (store) {
                    locationId = store._id;
                    storeName = store.name;
                    // Prefer Store Manager
                    if (store.managerEmail) {
                        assignedTo = store.managerEmail;
                    }
                }
            }

            // Determine Priority
            // NPS <= 3 is Critical (High)
            // NPS 4-6 is Medium
            const priority = (nps <= 3 || csat <= 1) ? TaskPriority.HIGH : TaskPriority.MEDIUM;

            // SLA Breach Time (24 hours from now)
            const slaBreachAt = new Date();
            slaBreachAt.setHours(slaBreachAt.getHours() + 24);

            // Create Task
            const task = await Task.create({
                tenantId,
                locationId,
                responseId,
                status: TaskStatus.OPEN,
                priority,
                assignedTo,
                slaBreachAt,
                history: [
                    {
                        action: 'CREATED',
                        note: `Auto-generated from feedback. NPS: ${nps}, CSAT: ${csat}`,
                        timestamp: new Date(),
                        actor: 'SYSTEM',
                    },
                ],
            });

            logger.info({ taskId: task._id, assignedTo }, '✅ Task created successfully');

            // Send Email Notification
            // Fire-and-forget to avoid blocking response
            sendTaskAlert(task, tenant, assignedTo).catch(err => {
                logger.error({ err }, 'Failed to send task alert email');
            });

            return task;

        } catch (error) {
            logger.error({ error, tenantId, responseId }, '❌ Failed to create task');
            return null;
        }
    }

    /**
     * Get Tasks with filters
     */
    static async getTasks(tenantId: string, filters: any = {}) {
        if (!tenantId) {
            console.error('[TaskService] getTasks called without tenantId');
            return [];
        }

        const query: any = { tenantId: new Types.ObjectId(tenantId) };

        if (filters.status) query.status = filters.status;
        if (filters.priority) query.priority = filters.priority;
        if (filters.assignedTo) query.assignedTo = filters.assignedTo;
        if (filters.locationId && Types.ObjectId.isValid(filters.locationId)) {
            query.locationId = new Types.ObjectId(filters.locationId);
        }

        console.log(`[TaskService] Query:`, JSON.stringify(query));

        try {
            const tasks = await Task.find(query)
                .populate('locationId', 'name')
                .populate('responseId', 'metrics customer answers submittedAt')
                .sort({ priority: 1, slaBreachAt: 1 });

            console.log(`[TaskService] Found ${tasks.length} tasks`);
            return tasks;
        } catch (err) {
            console.error('[TaskService] Error fetching tasks:', err);
            throw err;
        }
    }

    /**
     * Resolve Task
     */
    /**
     * Resolve Task with Proof
     */
    static async resolveTask(taskId: string, actor: string, note?: string, proofUrl?: string) {
        const task = await Task.findById(taskId);
        if (!task) throw new Error('Task not found');

        task.status = TaskStatus.RESOLVED; // Or VERIFIED if workflow demands
        if (note) task.resolutionNote = note;
        if (proofUrl) task.resolutionProofUrl = proofUrl;

        task.history.push({
            action: 'RESOLVED',
            note: note || 'Marked as resolved',
            timestamp: new Date(),
            actor,
        });

        return task.save();
    }

    /**
     * Reassign Task
     */
    static async reassignTask(
        taskId: string,
        newAssignee: string,
        actor: string,
        dueDate?: Date,
        reason?: string
    ) {
        const task = await Task.findById(taskId);
        if (!task) throw new Error('Task not found');

        const previousAssignee = task.assignedTo || 'Unassigned';

        // Add to Assignment History
        if (!task.assignmentHistory) task.assignmentHistory = [];
        task.assignmentHistory.push({
            assignedTo: previousAssignee,
            assignedBy: actor,
            assignedAt: new Date(),
            reason: reason || 'Task Transfer',
        });

        // Update fields
        task.assignedTo = newAssignee;
        if (dueDate) task.dueDate = dueDate;

        // Reset status if needed
        if (task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.RESOLVED) {
            task.status = TaskStatus.OPEN;
        }

        task.history.push({
            action: 'REASSIGNED',
            note: `Transferred from ${previousAssignee} to ${newAssignee}. Reason: ${reason}`,
            timestamp: new Date(),
            actor,
        });

        // TODO: Send email to new assignee

        return task.save();
    }
}
