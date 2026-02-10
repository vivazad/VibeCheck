import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
    tenantId: mongoose.Types.ObjectId;
    name: string;
    location?: string;
    storeCode?: string;
    posId?: string;
    managerEmail?: string;
    managerPhone?: string;
    phone?: string;
    active: boolean;
    settings: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        // Legacy location string, optional
        location: {
            type: String,
            trim: true,
        },
        // Internal Store Code
        storeCode: {
            type: String,
            trim: true,
        },
        // External POS ID
        posId: {
            type: String,
            trim: true,
            index: true,
        },
        managerEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        managerPhone: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        active: {
            type: Boolean,
            default: true,
        },
        settings: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index for store code per tenant
StoreSchema.index({ tenantId: 1, storeCode: 1 }, { unique: true, sparse: true });
// Compound unique index for posId per tenant
StoreSchema.index({ tenantId: 1, posId: 1 }, { unique: true, sparse: true });

export const Store = mongoose.model<IStore>('Store', StoreSchema);
