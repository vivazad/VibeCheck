import { ITenant, Store, IIntegration } from '../models/index.js';
import axios from 'axios';
import logger from '../utils/logger.js';

export interface IIntegrationAdapter {
    fetchLocations(apiKey: string): Promise<any[]>;
    pushFeedback(feedback: any): Promise<void>;
}

export class PetpoojaAdapter implements IIntegrationAdapter {
    async fetchLocations(apiKey: string): Promise<any[]> {
        // Mock Petpooja API call
        // In real world, call 'https://api.petpooja.com/v1/restaurants'
        await new Promise(resolve => setTimeout(resolve, 1000));

        return [
            {
                restaurant_id: 'PP-001',
                restaurant_name: 'Petpooja Downtown',
                manager_email: 'mgr1@petpooja.mock',
                phone: '9998887771',
            },
            {
                restaurant_id: 'PP-002',
                restaurant_name: 'Petpooja Mall Road',
                manager_email: 'mgr2@petpooja.mock',
                phone: '9998887772',
            }
        ];
    }

    async pushFeedback(feedback: any): Promise<void> {
        // Mock push to CRM
        logger.info({ feedback }, '📤 Pushing feedback to Petpooja CRM');
    }
}

export class IntegrationService {
    static getAdapter(provider: string): IIntegrationAdapter {
        if (provider === 'PETPOOJA') return new PetpoojaAdapter();
        // UrbanPiper pending
        throw new Error('Unsupported provider');
    }

    /**
     * Sync locations from integration source
     */
    static async syncLocations(tenant: ITenant, provider: 'PETPOOJA' | 'URBANPIPER') {
        const integration = tenant.integrations.find(i => i.provider === provider && i.active);
        if (!integration) throw new Error('Integration not configured or inactive');

        const adapter = this.getAdapter(provider);
        const locations = await adapter.fetchLocations(integration.apiKey);

        for (const loc of locations) {
            // Find or update Store
            let store = await Store.findOne({
                tenantId: tenant._id,
                posId: loc.restaurant_id
            });

            if (store) {
                store.name = loc.restaurant_name;
                store.managerEmail = loc.manager_email;
                store.managerPhone = loc.phone;
                await store.save();
            } else {
                await Store.create({
                    tenantId: tenant._id,
                    name: loc.restaurant_name,
                    posId: loc.restaurant_id,
                    managerEmail: loc.manager_email,
                    managerPhone: loc.phone,
                    active: true,
                    settings: {},
                });
            }
        }

        // Update lastSync timestamp
        integration.lastSync = new Date();
        // Mongoose doesn't auto-detect nested array changes easily unless marked modified?
        // Actually modifying property inside array element usually works if we save parent document.
        // We'll mark modified just in case.
        tenant.markModified('integrations');
        await tenant.save();

        return locations.length;
    }
}
