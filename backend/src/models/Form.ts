import mongoose, { Schema, Document, Types } from 'mongoose';

export type FormFieldType = 'nps' | 'csat' | 'text' | 'phone';

export interface IFormFieldLogic {
    showIf?: {
        questionId: string;
        operator: 'equals' | 'greaterThan' | 'lessThan';
        value: number | string;
    };
}

export interface IFormField {
    id: string;
    type: FormFieldType;
    label: string;
    required: boolean;
    logic?: IFormFieldLogic;
}

export interface IForm extends Document {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    name: string;
    active: boolean;
    fields: IFormField[];
    createdAt: Date;
    updatedAt: Date;
}

const FormFieldLogicSchema = new Schema<IFormFieldLogic>(
    {
        showIf: {
            questionId: { type: String },
            operator: { type: String, enum: ['equals', 'greaterThan', 'lessThan'] },
            value: { type: Schema.Types.Mixed },
        },
    },
    { _id: false }
);

const FormFieldSchema = new Schema<IFormField>(
    {
        id: { type: String, required: true },
        type: { type: String, enum: ['nps', 'csat', 'text', 'phone'], required: true },
        label: { type: String, required: true },
        required: { type: Boolean, default: false },
        logic: { type: FormFieldLogicSchema },
    },
    { _id: false }
);

const FormSchema = new Schema<IForm>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        name: { type: String, required: true, default: 'Default Feedback Form' },
        active: { type: Boolean, default: true },
        fields: { type: [FormFieldSchema], required: true },
    },
    {
        timestamps: true,
    }
);

// Compound index: Only one active form per tenant
FormSchema.index({ tenantId: 1, active: 1 });

export const Form = mongoose.model<IForm>('Form', FormSchema);
