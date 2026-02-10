import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Form, Tenant } from '../models/index.js';

/**
 * GET /api/v1/forms/:tenantId
 * Get active form for a tenant (public endpoint)
 */
export const getActiveForm = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.params;

        if (!Types.ObjectId.isValid(tenantId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid tenant ID',
            });
            return;
        }

        // Get tenant for theme config
        const tenant = await Tenant.findById(tenantId).select('name themeConfig tipping');
        if (!tenant) {
            res.status(404).json({
                success: false,
                error: 'Tenant not found',
            });
            return;
        }

        // Get active form
        const form = await Form.findOne({
            tenantId: new Types.ObjectId(tenantId),
            active: true,
        });

        if (!form) {
            res.status(404).json({
                success: false,
                error: 'No active form found',
            });
            return;
        }

        res.json({
            success: true,
            data: {
                form: {
                    id: form._id,
                    name: form.name,
                    fields: form.fields,
                },
                tenant: {
                    id: tenant._id,
                    name: tenant.name,
                    themeConfig: tenant.themeConfig,
                    tipping: tenant.tipping,
                },
            },
        });
    } catch (error) {
        console.error('Get form error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch form',
        });
    }
};

/**
 * GET /api/v1/forms
 * Get all forms for authenticated tenant
 */
export const getTenantForms = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;

        const forms = await Form.find({ tenantId: new Types.ObjectId(tenantId) }).sort({
            createdAt: -1,
        });

        res.json({
            success: true,
            data: { forms },
        });
    } catch (error) {
        console.error('Get tenant forms error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch forms',
        });
    }
};

/**
 * POST /api/v1/forms
 * Create a new form
 */
export const createForm = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;
        const { name, schema, setActive } = req.body;

        // If setActive, deactivate other forms
        if (setActive) {
            await Form.updateMany(
                { tenantId: new Types.ObjectId(tenantId) },
                { $set: { active: false } }
            );
        }

        const form = new Form({
            tenantId: new Types.ObjectId(tenantId),
            name: name || 'New Form',
            active: setActive || false,
            fields: schema || [],
        });

        await form.save();

        res.status(201).json({
            success: true,
            data: { form },
        });
    } catch (error) {
        console.error('Create form error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create form',
        });
    }
};

/**
 * PUT /api/v1/forms/:formId
 * Update a form
 */
export const updateForm = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;
        const { formId } = req.params;
        const { name, schema, active } = req.body;

        if (!Types.ObjectId.isValid(formId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid form ID',
            });
            return;
        }

        // If setting active, deactivate other forms
        if (active) {
            await Form.updateMany(
                { tenantId: new Types.ObjectId(tenantId), _id: { $ne: formId } },
                { $set: { active: false } }
            );
        }

        const form = await Form.findOneAndUpdate(
            { _id: formId, tenantId: new Types.ObjectId(tenantId) },
            {
                $set: {
                    ...(name && { name }),
                    ...(schema && { fields: schema }),
                    ...(active !== undefined && { active }),
                },
            },
            { new: true }
        );

        if (!form) {
            res.status(404).json({
                success: false,
                error: 'Form not found',
            });
            return;
        }

        res.json({
            success: true,
            data: { form },
        });
    } catch (error) {
        console.error('Update form error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update form',
        });
    }
};
