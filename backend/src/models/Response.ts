import mongoose, { Schema, Document, Types } from 'mongoose';

export type SubmissionSource = 'qr_static' | 'qr_magic';

export interface ICustomer {
    phone?: string;
    orderId?: string;
    storeId?: mongoose.Types.ObjectId;
    source: SubmissionSource;
}

export interface IMetrics {
    npsScore?: number;
    csatScore?: number;
}

export interface IAnswer {
    questionId: string;
    value: number | string;
}

export interface IResponse extends Document {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    formId: Types.ObjectId;
    customer: ICustomer;
    metrics: IMetrics;
    answers: IAnswer[];
    submittedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
    {
        phone: { type: String },
        orderId: { type: String },
        storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
        source: { type: String, enum: ['qr_static', 'qr_magic'], required: true },
    },
    { _id: false }
);

const MetricsSchema = new Schema<IMetrics>(
    {
        npsScore: { type: Number, min: 0, max: 10 },
        csatScore: { type: Number, min: 1, max: 5 },
    },
    { _id: false }
);

const AnswerSchema = new Schema<IAnswer>(
    {
        questionId: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
    },
    { _id: false }
);

const ResponseSchema = new Schema<IResponse>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        formId: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
        customer: { type: CustomerSchema, required: true },
        metrics: { type: MetricsSchema, default: () => ({}) },
        answers: { type: [AnswerSchema], required: true },
        submittedAt: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: false,
    }
);

// Compound indexes for efficient queries
ResponseSchema.index({ tenantId: 1, submittedAt: -1 });
ResponseSchema.index({ tenantId: 1, 'customer.orderId': 1 }, { sparse: true });

export const Response = mongoose.model<IResponse>('Response', ResponseSchema);
