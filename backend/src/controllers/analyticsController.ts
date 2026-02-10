import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Response as ResponseModel, Store } from '../models/index.js';

interface DailyBucket {
    date: string;
    avgNps: number;
    avgCsat: number;
    count: number;
}

interface HeatmapCell {
    dayOfWeek: number;
    hour: number;
    avgNps: number;
    count: number;
}

interface StoreStats {
    storeId: string | null;
    storeName: string;
    count: number;
    avgNps: number;
    avgCsat: number;
    npsScore: number;
}

interface AnalyticsResponse {
    dailyTrends: DailyBucket[];
    heatmap: HeatmapCell[];
    storeBreakdown: StoreStats[];
    summary: {
        totalResponses: number;
        avgNps: number;
        avgCsat: number;
        promoters: number;
        passives: number;
        detractors: number;
        npsScore: number;
    };
}

/**
 * GET /api/v1/analytics/:tenantId
 * Get analytics data with MongoDB aggregation
 */
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.params;
        const range = (req.query.range as string) || '30d';

        if (!Types.ObjectId.isValid(tenantId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid tenant ID',
            });
            return;
        }

        // Calculate date range
        const days = parseInt(range.replace('d', ''), 10) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const tenantObjectId = new Types.ObjectId(tenantId);

        // Daily trends aggregation
        const dailyTrends = await ResponseModel.aggregate<DailyBucket>([
            {
                $match: {
                    tenantId: tenantObjectId,
                    submittedAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' },
                    },
                    avgNps: { $avg: '$metrics.npsScore' },
                    avgCsat: { $avg: '$metrics.csatScore' },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    avgNps: { $round: ['$avgNps', 1] },
                    avgCsat: { $round: ['$avgCsat', 1] },
                    count: 1,
                },
            },
            { $sort: { date: 1 } },
        ]);

        // Heatmap aggregation (day of week x hour)
        const heatmap = await ResponseModel.aggregate<HeatmapCell>([
            {
                $match: {
                    tenantId: tenantObjectId,
                    submittedAt: { $gte: startDate },
                    'metrics.npsScore': { $exists: true },
                },
            },
            {
                $group: {
                    _id: {
                        dayOfWeek: { $dayOfWeek: '$submittedAt' }, // 1=Sunday, 7=Saturday
                        hour: { $hour: '$submittedAt' },
                    },
                    avgNps: { $avg: '$metrics.npsScore' },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    dayOfWeek: { $subtract: ['$_id.dayOfWeek', 1] }, // Convert to 0=Sunday
                    hour: '$_id.hour',
                    avgNps: { $round: ['$avgNps', 1] },
                    count: 1,
                },
            },
            { $sort: { dayOfWeek: 1, hour: 1 } },
        ]);

        // Summary statistics
        const summaryAgg = await ResponseModel.aggregate([
            {
                $match: {
                    tenantId: tenantObjectId,
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
                                {
                                    $and: [
                                        { $gte: ['$metrics.npsScore', 7] },
                                        { $lt: ['$metrics.npsScore', 9] },
                                    ],
                                },
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

        const summaryData = summaryAgg[0] || {
            totalResponses: 0,
            avgNps: 0,
            avgCsat: 0,
            promoters: 0,
            passives: 0,
            detractors: 0,
        };

        // Calculate NPS score: % Promoters - % Detractors
        const npsScore =
            summaryData.totalResponses > 0
                ? Math.round(
                    ((summaryData.promoters - summaryData.detractors) /
                        summaryData.totalResponses) *
                    100
                )
                : 0;

        // Store breakdown aggregation
        const storeAgg = await ResponseModel.aggregate([
            {
                $match: {
                    tenantId: tenantObjectId,
                    submittedAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: '$customer.storeId',
                    count: { $sum: 1 },
                    avgNps: { $avg: '$metrics.npsScore' },
                    avgCsat: { $avg: '$metrics.csatScore' },
                    promoters: {
                        $sum: { $cond: [{ $gte: ['$metrics.npsScore', 9] }, 1, 0] },
                    },
                    detractors: {
                        $sum: { $cond: [{ $lt: ['$metrics.npsScore', 7] }, 1, 0] },
                    },
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Fetch store names
        const storeIds = storeAgg.map(s => s._id).filter(id => id);
        const storesMap: Record<string, string> = {};
        if (storeIds.length > 0) {
            const stores = await Store.find({ _id: { $in: storeIds } }).lean();
            stores.forEach(store => {
                storesMap[store._id.toString()] = store.name;
            });
        }

        const storeBreakdown: StoreStats[] = storeAgg.map(s => ({
            storeId: s._id ? s._id.toString() : null,
            storeName: s._id ? (storesMap[s._id.toString()] || 'Unknown Store') : 'All Locations',
            count: s.count,
            avgNps: Math.round((s.avgNps || 0) * 10) / 10,
            avgCsat: Math.round((s.avgCsat || 0) * 10) / 10,
            npsScore: s.count > 0
                ? Math.round(((s.promoters - s.detractors) / s.count) * 100)
                : 0,
        }));

        const response: AnalyticsResponse = {
            dailyTrends,
            heatmap,
            storeBreakdown,
            summary: {
                totalResponses: summaryData.totalResponses,
                avgNps: Math.round((summaryData.avgNps || 0) * 10) / 10,
                avgCsat: Math.round((summaryData.avgCsat || 0) * 10) / 10,
                promoters: summaryData.promoters,
                passives: summaryData.passives,
                detractors: summaryData.detractors,
                npsScore,
            },
        };

        res.json({
            success: true,
            data: response,
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics',
        });
    }
};

/**
 * GET /api/v1/responses/:tenantId
 * Get recent responses for a tenant
 */
export const getResponses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.params;
        const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
        const page = parseInt(req.query.page as string, 10) || 1;
        const skip = (page - 1) * limit;

        if (!Types.ObjectId.isValid(tenantId)) {
            res.status(400).json({
                success: false,
                error: 'Invalid tenant ID',
            });
            return;
        }

        const responses = await ResponseModel.find({ tenantId: new Types.ObjectId(tenantId) })
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await ResponseModel.countDocuments({ tenantId: new Types.ObjectId(tenantId) });

        res.json({
            success: true,
            data: {
                responses,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Get responses error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch responses',
        });
    }
};
