import { Types } from 'mongoose';
import { Tenant, Form, Response } from '../models/index.js';
import bcrypt from 'bcryptjs';

/**
 * Seed script to create demo data for testing
 * Run with: npx tsx src/scripts/seed.ts
 */
async function seed() {
    console.log('🌱 Seeding database...');

    // Create demo tenant
    const passwordHash = await bcrypt.hash('demo123', 12);

    const tenant = await Tenant.findOneAndUpdate(
        { ownerEmail: 'demo@vibecheck.com' },
        {
            name: 'Demo Restaurant',
            ownerEmail: 'demo@vibecheck.com',
            ownerPhone: '+919876543210',
            passwordHash,
            themeConfig: {
                primaryColor: '#6366f1',
                borderRadius: 8,
            },
            tipping: {
                enabled: true,
                provider: 'UPI',
                vpa: 'demo@upi',
            },
            settings: {
                alertThreshold: 6,
            },
        },
        { upsert: true, new: true }
    );

    console.log('✅ Created tenant:', tenant.name);

    // Create demo form
    const form = await Form.findOneAndUpdate(
        { tenantId: tenant._id, name: 'Customer Feedback' },
        {
            tenantId: tenant._id,
            name: 'Customer Feedback',
            active: true,
            fields: [
                {
                    id: 'nps_score',
                    type: 'nps',
                    label: 'How likely are you to recommend us to a friend or colleague?',
                    required: true,
                },
                {
                    id: 'csat_score',
                    type: 'csat',
                    label: 'How satisfied are you with your overall experience?',
                    required: true,
                },
                {
                    id: 'feedback',
                    type: 'text',
                    label: 'Any additional feedback for us?',
                    required: false,
                },
            ],
        },
        { upsert: true, new: true }
    );

    console.log('✅ Created form:', form.name);

    // Generate sample responses for the last 30 days
    const now = new Date();
    const responses = [];

    for (let i = 0; i < 100; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const submittedAt = new Date(now);
        submittedAt.setDate(submittedAt.getDate() - daysAgo);
        submittedAt.setHours(hoursAgo, Math.floor(Math.random() * 60), 0, 0);

        // Generate realistic NPS distribution (bimodal - mostly promoters and detractors)
        const rand = Math.random();
        let npsScore: number;
        if (rand < 0.2) {
            // Detractors (0-6)
            npsScore = Math.floor(Math.random() * 7);
        } else if (rand < 0.35) {
            // Passives (7-8)
            npsScore = 7 + Math.floor(Math.random() * 2);
        } else {
            // Promoters (9-10)
            npsScore = 9 + Math.floor(Math.random() * 2);
        }

        // CSAT correlates with NPS
        const csatBase = Math.floor((npsScore / 10) * 5);
        const csatScore = Math.max(1, Math.min(5, csatBase + Math.floor(Math.random() * 2)));

        responses.push({
            tenantId: tenant._id,
            formId: form._id,
            customer: {
                phone: Math.random() > 0.7 ? `+91${Math.floor(Math.random() * 9000000000) + 1000000000}` : undefined,
                orderId: Math.random() > 0.5 ? `ORD-${Math.floor(Math.random() * 10000)}` : undefined,
                source: Math.random() > 0.5 ? 'qr_magic' : 'qr_static',
            },
            metrics: {
                npsScore,
                csatScore,
            },
            answers: [
                { questionId: 'nps_score', value: npsScore },
                { questionId: 'csat_score', value: csatScore },
            ],
            submittedAt,
        });
    }

    await Response.deleteMany({ tenantId: tenant._id });
    await Response.insertMany(responses);

    console.log(`✅ Created ${responses.length} sample responses`);
    console.log('\n📋 Demo credentials:');
    console.log('   Email: demo@vibecheck.com');
    console.log('   Password: demo123');
    console.log(`   Tenant ID: ${tenant._id}`);
}

// Connect and run
import { connectDatabase } from '../config/database.js';

connectDatabase()
    .then(() => seed())
    .then(() => {
        console.log('\n✅ Seeding complete!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    });
