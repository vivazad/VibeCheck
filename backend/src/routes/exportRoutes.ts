import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Response as FeedbackResponse, Tenant } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/v1/export/responses
 * Get paginated responses for authenticated tenant
 */
router.get('/responses', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;
        const {
            page = '1',
            limit = '50',
            startDate,
            endDate,
            minNps,
            maxNps,
            source,
            sortBy = 'submittedAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = Math.min(parseInt(limit as string), 100);
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query: Record<string, unknown> = { tenantId: new Types.ObjectId(tenantId) };

        // Date filters
        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) {
                (query.submittedAt as Record<string, Date>).$gte = new Date(startDate as string);
            }
            if (endDate) {
                (query.submittedAt as Record<string, Date>).$lte = new Date(endDate as string);
            }
        }

        // NPS filters
        if (minNps) {
            query['metrics.npsScore'] = { ...query['metrics.npsScore'] as object, $gte: parseInt(minNps as string) };
        }
        if (maxNps) {
            query['metrics.npsScore'] = { ...query['metrics.npsScore'] as object, $lte: parseInt(maxNps as string) };
        }

        // Source filter
        if (source) {
            query['customer.source'] = source;
        }

        // Sort configuration
        const sortConfig: Record<string, 1 | -1> = {
            [sortBy as string]: sortOrder === 'asc' ? 1 : -1
        };

        // Execute query
        const [responses, total] = await Promise.all([
            FeedbackResponse.find(query)
                .sort(sortConfig)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            FeedbackResponse.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                responses: responses.map(r => ({
                    id: r._id,
                    submittedAt: r.submittedAt,
                    npsScore: r.metrics?.npsScore,
                    csatScore: r.metrics?.csatScore,
                    source: r.customer?.source,
                    phone: r.customer?.phone ? maskPhone(r.customer.phone) : null,
                    orderId: r.customer?.orderId,
                    answers: r.answers,
                })),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                }
            }
        });
    } catch (error) {
        console.error('Export responses error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export responses',
        });
    }
});

/**
 * GET /api/v1/export/csv
 * Download responses as CSV
 */
router.get('/csv', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;
        const { startDate, endDate, source } = req.query;

        // Get tenant name for filename
        const tenant = await Tenant.findById(tenantId).select('name');
        const tenantName = tenant?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'export';

        // Build query
        const query: Record<string, unknown> = { tenantId: new Types.ObjectId(tenantId) };

        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) {
                (query.submittedAt as Record<string, Date>).$gte = new Date(startDate as string);
            }
            if (endDate) {
                (query.submittedAt as Record<string, Date>).$lte = new Date(endDate as string);
            }
        }

        if (source) {
            query['customer.source'] = source;
        }

        // Fetch all matching responses
        const responses = await FeedbackResponse.find(query)
            .sort({ submittedAt: -1 })
            .lean();

        // Generate CSV content
        const csvHeader = 'Date,Time,NPS Score,NPS Category,CSAT Score,Source,Order ID,Phone,Feedback\n';
        const csvRows = responses.map(r => {
            const date = new Date(r.submittedAt);
            const npsScore = r.metrics?.npsScore ?? '';
            const npsCategory = typeof npsScore === 'number'
                ? (npsScore >= 9 ? 'Promoter' : npsScore >= 7 ? 'Passive' : 'Detractor')
                : '';
            const csatScore = r.metrics?.csatScore ?? '';
            const source = r.customer?.source || '';
            const orderId = r.customer?.orderId || '';
            const phone = r.customer?.phone || '';

            // Extract text feedback from answers
            const textAnswer = r.answers?.find(a => typeof a.value === 'string' && a.value.length > 5);
            const feedback = textAnswer?.value || '';

            // Escape CSV fields
            const escapeCsv = (val: unknown): string => {
                const str = String(val);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            return [
                date.toISOString().split('T')[0],
                date.toTimeString().split(' ')[0],
                npsScore,
                npsCategory,
                csatScore,
                source,
                orderId,
                phone,
                escapeCsv(feedback)
            ].join(',');
        }).join('\n');

        const csv = csvHeader + csvRows;

        // Set headers for file download
        const filename = `${tenantName}_responses_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate CSV',
        });
    }
});

/**
 * GET /api/v1/export/stats
 * Get export statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.tenant!;

        const stats = await FeedbackResponse.aggregate([
            { $match: { tenantId: new Types.ObjectId(tenantId) } },
            {
                $group: {
                    _id: null,
                    totalResponses: { $sum: 1 },
                    avgNps: { $avg: '$metrics.npsScore' },
                    avgCsat: { $avg: '$metrics.csatScore' },
                    promoters: {
                        $sum: { $cond: [{ $gte: ['$metrics.npsScore', 9] }, 1, 0] }
                    },
                    passives: {
                        $sum: { $cond: [{ $and: [{ $gte: ['$metrics.npsScore', 7] }, { $lt: ['$metrics.npsScore', 9] }] }, 1, 0] }
                    },
                    detractors: {
                        $sum: { $cond: [{ $lt: ['$metrics.npsScore', 7] }, 1, 0] }
                    },
                    firstResponse: { $min: '$submittedAt' },
                    lastResponse: { $max: '$submittedAt' },
                }
            }
        ]);

        const data = stats[0] || {
            totalResponses: 0,
            avgNps: 0,
            avgCsat: 0,
            promoters: 0,
            passives: 0,
            detractors: 0,
        };

        // Calculate NPS
        const totalWithNps = data.promoters + data.passives + data.detractors;
        const nps = totalWithNps > 0
            ? Math.round(((data.promoters - data.detractors) / totalWithNps) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                totalResponses: data.totalResponses,
                nps,
                avgNps: Math.round((data.avgNps || 0) * 10) / 10,
                avgCsat: Math.round((data.avgCsat || 0) * 10) / 10,
                breakdown: {
                    promoters: data.promoters,
                    passives: data.passives,
                    detractors: data.detractors,
                },
                dateRange: {
                    first: data.firstResponse,
                    last: data.lastResponse,
                }
            }
        });
    } catch (error) {
        console.error('Export stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stats',
        });
    }
});

// Helper to mask phone numbers
function maskPhone(phone: string): string {
    if (phone.length <= 4) return phone;
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
}

export default router;
