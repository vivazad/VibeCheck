import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Store, Response as FeedbackResponse } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/v1/stores
 * List all stores for authenticated tenant
 */
router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;

        const stores = await Store.find({ tenantId: new Types.ObjectId(tenantId) })
            .sort({ name: 1 })
            .lean();

        res.json({
            success: true,
            data: { stores },
        });
    } catch (error) {
        console.error('List stores error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stores',
        });
    }
});

/**
 * POST /api/v1/stores
 * Create a new store
 */
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;
        const { name, location, storeCode, phone } = req.body;

        if (!name) {
            res.status(400).json({
                success: false,
                error: 'Store name is required',
            });
            return;
        }

        // Check if storeCode is unique for this tenant
        if (storeCode) {
            const existing = await Store.findOne({
                tenantId: new Types.ObjectId(tenantId),
                storeCode,
            });
            if (existing) {
                res.status(400).json({
                    success: false,
                    error: 'Store code already exists',
                });
                return;
            }
        }

        const store = await Store.create({
            tenantId: new Types.ObjectId(tenantId),
            name,
            location,
            storeCode,
            phone,
        });

        res.status(201).json({
            success: true,
            data: { store },
        });
    } catch (error) {
        console.error('Create store error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create store',
        });
    }
});

/**
 * POST /api/v1/stores/bulk
 * Bulk create stores from Excel/CSV data (up to 500 stores)
 */
router.post('/bulk', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;
        const { stores } = req.body as { stores: Array<{ name: string; location?: string; storeCode?: string; phone?: string }> };

        if (!stores || !Array.isArray(stores)) {
            res.status(400).json({
                success: false,
                error: 'Stores array is required',
            });
            return;
        }

        if (stores.length > 500) {
            res.status(400).json({
                success: false,
                error: 'Maximum 500 stores allowed per batch',
            });
            return;
        }

        // Validate all stores have names
        const invalidStores = stores.filter((s, idx) => !s.name || s.name.trim() === '');
        if (invalidStores.length > 0) {
            res.status(400).json({
                success: false,
                error: `${invalidStores.length} store(s) are missing names`,
            });
            return;
        }

        // Check for duplicate store codes within the batch
        const storeCodes = stores.filter(s => s.storeCode).map(s => s.storeCode);
        const batchDuplicates = storeCodes.filter((code, idx) => storeCodes.indexOf(code) !== idx);
        if (batchDuplicates.length > 0) {
            res.status(400).json({
                success: false,
                error: `Duplicate store codes in upload: ${batchDuplicates.join(', ')}`,
            });
            return;
        }

        // Check for existing store codes in database
        if (storeCodes.length > 0) {
            const existing = await Store.find({
                tenantId: new Types.ObjectId(tenantId),
                storeCode: { $in: storeCodes },
            }).lean();

            if (existing.length > 0) {
                res.status(400).json({
                    success: false,
                    error: `Store codes already exist: ${existing.map(s => s.storeCode).join(', ')}`,
                });
                return;
            }
        }

        // Prepare store documents
        const storeDocs = stores.map(s => ({
            tenantId: new Types.ObjectId(tenantId),
            name: s.name.trim(),
            location: s.location?.trim() || undefined,
            storeCode: s.storeCode?.trim() || undefined,
            phone: s.phone?.trim() || undefined,
            active: true,
        }));

        // Bulk insert
        const created = await Store.insertMany(storeDocs);

        res.status(201).json({
            success: true,
            data: {
                count: created.length,
                stores: created,
            },
        });
    } catch (error) {
        console.error('Bulk create stores error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to bulk create stores',
        });
    }
});

/**
 * PUT /api/v1/stores/:storeId
 * Update a store
 */
router.put('/:storeId', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;
        const { storeId } = req.params;
        const { name, location, storeCode, phone, active } = req.body;

        const store = await Store.findOneAndUpdate(
            {
                _id: new Types.ObjectId(storeId),
                tenantId: new Types.ObjectId(tenantId),
            },
            { $set: { name, location, storeCode, phone, active } },
            { new: true }
        );

        if (!store) {
            res.status(404).json({
                success: false,
                error: 'Store not found',
            });
            return;
        }

        res.json({
            success: true,
            data: { store },
        });
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update store',
        });
    }
});

/**
 * DELETE /api/v1/stores/:storeId
 * Delete a store
 */
router.delete('/:storeId', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;
        const { storeId } = req.params;

        const store = await Store.findOneAndDelete({
            _id: new Types.ObjectId(storeId),
            tenantId: new Types.ObjectId(tenantId),
        });

        if (!store) {
            res.status(404).json({
                success: false,
                error: 'Store not found',
            });
            return;
        }

        res.json({
            success: true,
            message: 'Store deleted successfully',
        });
    } catch (error) {
        console.error('Delete store error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete store',
        });
    }
});

/**
 * GET /api/v1/stores/:storeId/analytics
 * Get analytics for a specific store
 */
router.get('/:storeId/analytics', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;
        const { storeId } = req.params;
        const { range = '30d' } = req.query;

        // Verify store belongs to tenant
        const store = await Store.findOne({
            _id: new Types.ObjectId(storeId),
            tenantId: new Types.ObjectId(tenantId),
        });

        if (!store) {
            res.status(404).json({
                success: false,
                error: 'Store not found',
            });
            return;
        }

        // Calculate date range
        const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get analytics for this store
        const stats = await FeedbackResponse.aggregate([
            {
                $match: {
                    tenantId: new Types.ObjectId(tenantId),
                    'customer.storeId': new Types.ObjectId(storeId),
                    submittedAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalResponses: { $sum: 1 },
                    avgNps: { $avg: '$metrics.npsScore' },
                    avgCsat: { $avg: '$metrics.csatScore' },
                    promoters: {
                        $sum: { $cond: [{ $gte: ['$metrics.npsScore', 9] }, 1, 0] },
                    },
                    passives: {
                        $sum: {
                            $cond: [
                                { $and: [{ $gte: ['$metrics.npsScore', 7] }, { $lt: ['$metrics.npsScore', 9] }] },
                                1,
                                0,
                            ],
                        },
                    },
                    detractors: {
                        $sum: { $cond: [{ $lt: ['$metrics.npsScore', 7] }, 1, 0] },
                    },
                },
            },
        ]);

        const data = stats[0] || {
            totalResponses: 0,
            avgNps: 0,
            avgCsat: 0,
            promoters: 0,
            passives: 0,
            detractors: 0,
        };

        // Calculate NPS score
        const totalWithNps = data.promoters + data.passives + data.detractors;
        const nps = totalWithNps > 0
            ? Math.round(((data.promoters - data.detractors) / totalWithNps) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                store: {
                    id: store._id,
                    name: store.name,
                    location: store.location,
                },
                analytics: {
                    totalResponses: data.totalResponses,
                    nps,
                    avgNps: Math.round((data.avgNps || 0) * 10) / 10,
                    avgCsat: Math.round((data.avgCsat || 0) * 10) / 10,
                    breakdown: {
                        promoters: data.promoters,
                        passives: data.passives,
                        detractors: data.detractors,
                    },
                },
            },
        });
    } catch (error) {
        console.error('Store analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get store analytics',
        });
    }
});

export default router;
