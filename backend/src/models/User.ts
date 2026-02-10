import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
    email: string;
    passwordHash?: string;
    googleId?: string;
    name: string;
    role: 'admin' | 'manager';
    tenantId?: Types.ObjectId; // Optional during onboarding
    status: 'active' | 'invited' | 'pending_onboarding';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String },
        googleId: { type: String, unique: true, sparse: true },
        name: { type: String, required: true },
        role: { type: String, enum: ['admin', 'manager'], default: 'admin' },
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
        status: {
            type: String,
            enum: ['active', 'invited', 'pending_onboarding'],
            default: 'pending_onboarding'
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });

export const User = mongoose.model<IUser>('User', UserSchema);
