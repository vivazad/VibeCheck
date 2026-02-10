import { Types } from 'mongoose';
import { Tenant, Form, Response } from '../models/index.js';
import { connectDatabase } from '../config/database.js';

async function seedLatest() {
    console.log('🌱 Seeding data for the latest tenant...');

    try {
        await connectDatabase();

        // 1. Find the most recently created tenant
        const tenant = await Tenant.findOne().sort({ createdAt: -1 });

        if (!tenant) {
            console.error('❌ No tenant found! Please sign up and create a workspace first.');
            process.exit(1);
        }

        console.log(`✅ Found tenant: ${tenant.name} (${tenant._id})`);

        // 2. Find or create a form for this tenant
        let form = await Form.findOne({ tenantId: tenant._id, active: true });

        if (!form) {
            console.log('ℹ️ No active form found, creating one...');
            form = await Form.create({
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
            });
            console.log('✅ Created form:', form.name);
        } else {
            console.log('✅ Found existing form:', form.name);
        }

        // 3. Generate mock responses
        console.log('⏳ Generating 50 mock responses...');
        const now = new Date();
        const responses = [];

        for (let i = 0; i < 50; i++) {
            // Random time in last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const hoursAgo = Math.floor(Math.random() * 24);
            const submittedAt = new Date(now);
            submittedAt.setDate(submittedAt.getDate() - daysAgo);
            submittedAt.setHours(hoursAgo, Math.floor(Math.random() * 60), 0, 0);

            // Realistic NPS distribution
            const rand = Math.random();
            let npsScore: number;
            if (rand < 0.25) npsScore = Math.floor(Math.random() * 7); // Detractor
            else if (rand < 0.45) npsScore = 7 + Math.floor(Math.random() * 2); // Passive
            else npsScore = 9 + Math.floor(Math.random() * 2); // Promoter

            // CSAT correlates with NPS
            const csatBase = Math.floor((npsScore / 10) * 5);
            const csatScore = Math.max(1, Math.min(5, csatBase + Math.floor(Math.random() * 2)));

            responses.push({
                tenantId: tenant._id,
                formId: form._id,
                customer: {
                    phone: Math.random() > 0.6 ? `+1555${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}` : undefined,
                    source: Math.random() > 0.5 ? 'qr_magic' : 'qr_static',
                },
                metrics: {
                    npsScore,
                    csatScore,
                },
                answers: [
                    { questionId: 'nps_score', value: npsScore },
                    { questionId: 'csat_score', value: csatScore },
                    { questionId: 'feedback', value: Math.random() > 0.7 ? 'Great service!' : '' }
                ],
                submittedAt,
            });
        }

        // Insert responses
        await Response.deleteMany({ tenantId: tenant._id }); // Clear old mock data if needed? Or append? I'll clear to be clean.
        await Response.insertMany(responses);

        console.log(`✅ Successfully seeded ${responses.length} responses for ${tenant.name}.`);
        console.log(`\n🔗 QR Demo Link: http://localhost:5173/rate?tenantId=${tenant._id}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedLatest();
