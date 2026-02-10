import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IThemeConfig {
    primaryColor: string;
    backgroundColor: string;
    logoUrl?: string;
    borderRadius: number;
    greetingTitle: string;
    greetingMessage: string;
}

export interface ITipping {
    enabled: boolean;
    provider: 'UPI' | 'PAYPAL';
    vpa?: string;
    merchantId?: string;
}

export interface ITaskConfig {
    requireResolutionNote: boolean;
    requireResolutionProof: boolean;
    allowReassignment: boolean;
}

export interface ISettings {
    alertThreshold: number;
    taskConfig: ITaskConfig;
}

export interface IIntegration {
    provider: 'PETPOOJA' | 'URBANPIPER';
    apiKey: string;
    active: boolean;
    lastSync?: Date;
}

export interface ITenant extends Document {
    _id: Types.ObjectId;
    name: string;
    ownerEmail: string;
    ownerPhone: string;
    webhookUrl?: string;
    themeConfig: IThemeConfig;
    tipping: ITipping;
    settings: ISettings;
    integrations: IIntegration[];
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

const ThemeConfigSchema = new Schema<IThemeConfig>(
    {
        primaryColor: { type: String, default: '#6366f1' },
        backgroundColor: { type: String, default: '#0f0f17' },
        logoUrl: { type: String },
        borderRadius: { type: Number, default: 8 },
        greetingTitle: { type: String, default: 'Rate your experience' },
        greetingMessage: { type: String, default: 'Help us serve you better.' },
    },
    { _id: false }
);

const TippingSchema = new Schema<ITipping>(
    {
        enabled: { type: Boolean, default: false },
        provider: { type: String, enum: ['UPI', 'PAYPAL'], default: 'UPI' },
        vpa: { type: String },
        merchantId: { type: String },
    },
    { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
    {
        alertThreshold: { type: Number, default: 6 },
        taskConfig: {
            requireResolutionNote: { type: Boolean, default: true },
            requireResolutionProof: { type: Boolean, default: false },
            allowReassignment: { type: Boolean, default: true },
        },
    },
    { _id: false }
);

const TenantSchema = new Schema<ITenant>(
    {
        name: { type: String, required: true, trim: true },
        ownerEmail: { type: String, required: true, lowercase: true, trim: true },
        ownerPhone: { type: String, required: true, trim: true },
        webhookUrl: { type: String },
        themeConfig: { type: ThemeConfigSchema, default: () => ({}) },
        tipping: { type: TippingSchema, default: () => ({}) },
        settings: { type: SettingsSchema, default: () => ({}) },
        integrations: [
            {
                provider: { type: String, enum: ['PETPOOJA', 'URBANPIPER'], required: true },
                apiKey: { type: String, required: true },
                active: { type: Boolean, default: true },
                lastSync: { type: Date },
            },
        ],
        passwordHash: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

// Indexes
TenantSchema.index({ ownerEmail: 1 }, { unique: true });

export const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);
