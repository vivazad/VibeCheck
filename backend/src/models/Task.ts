import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TaskStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    VERIFIED = 'VERIFIED'
}

export enum TaskPriority {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW'
}

export interface ITaskHistory {
    action: string;
    note?: string;
    timestamp: Date;
    actor?: string;
}

export interface IAssignmentHistory {
    assignedTo: string;
    assignedBy: string;
    assignedAt: Date;
    reason?: string;
}

export interface ITask extends Document {
    tenantId: Types.ObjectId;
    locationId?: Types.ObjectId;
    responseId: Types.ObjectId;
    status: TaskStatus;
    priority: TaskPriority;
    assignedTo?: string; // Manager Email
    assignmentHistory: IAssignmentHistory[];
    resolutionProofUrl?: string;
    resolutionNote?: string;
    history: ITaskHistory[];
    slaBreachAt: Date;
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            index: true,
        },
        locationId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            index: true,
        },
        responseId: {
            type: Schema.Types.ObjectId,
            ref: 'Response',
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.OPEN,
            index: true,
        },
        priority: {
            type: String,
            enum: Object.values(TaskPriority),
            default: TaskPriority.MEDIUM,
        },
        assignedTo: {
            type: String,
            lowercase: true,
            trim: true,
        },
        assignmentHistory: [{
            assignedTo: { type: String, required: true },
            assignedBy: { type: String, required: true },
            assignedAt: { type: Date, default: Date.now },
            reason: { type: String },
        }],
        resolutionProofUrl: { type: String },
        resolutionNote: { type: String },
        dueDate: { type: Date },
        history: [
            {
                action: { type: String, required: true },
                note: { type: String },
                timestamp: { type: Date, default: Date.now },
                actor: { type: String },
            },
        ],
        slaBreachAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
TaskSchema.index({ tenantId: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
