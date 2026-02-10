import { Request, Response } from 'express';
import { Tenant, IIntegration } from '../models/index.js';
import { IntegrationService } from '../services/index.js';
import { Types } from 'mongoose';

/**
 * POST /api/v1/integrations/connect
 * Save integration credentials
 */
export const connectIntegration = async (req: Request, res: Response) => {
    try {
        const { provider, apiKey, active } = req.body;
        const tenantId = (req as any).user.tenantId;

        // Find Tenant
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

        // Update or Add Integration
        // Ensure integrations array exists
        if (!tenant.integrations) tenant.integrations = [];

        const existing = tenant.integrations.find(i => i.provider === provider);
        if (existing) {
            existing.apiKey = apiKey;
            existing.active = active;
        } else {
            tenant.integrations.push({
                provider,
                apiKey,
                active: true,
            });
        }

        await tenant.save();

        res.json({
            success: true,
            data: tenant.integrations,
        });
    } catch (error) {
        console.error('Connect Integration Error:', error);
        res.status(500).json({ error: 'Failed to connect integration' });
    }
};

/**
 * POST /api/v1/integrations/sync
 * Manually trigger sync for an integration
 */
export const syncIntegration = async (req: Request, res: Response) => {
    try {
        const { provider } = req.body;
        const tenantId = (req as any).user.tenantId;

        const tenant = await Tenant.findById(tenantId);
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

        // Trigger Sync
        const count = await IntegrationService.syncLocations(tenant, provider);

        res.json({
            success: true,
            message: `Successfully synced ${count} locations`,
            lastSync: new Date(),
        });
    } catch (error) {
        console.error('Sync Integration Error:', error);
        res.status(500).json({ error: 'Failed to sync integration' });
    }
};
