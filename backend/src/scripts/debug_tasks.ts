import mongoose from 'mongoose';
import { Task, Response, Tenant, Form } from '../models/index.js';
import { connectDatabase } from '../config/database.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const debug = async () => {
    await connectDatabase();

    const tenants = await Tenant.find();
    console.log(`Found ${tenants.length} tenants.`);

    for (const tenant of tenants) {
        console.log(`\nTenant: ${tenant.name} (${tenant._id})`);

        const tasks = await Task.find({ tenantId: tenant._id });
        console.log(`- Total Tasks: ${tasks.length}`);

        if (tasks.length > 0) {
            console.log('  Tasks Sample:', JSON.stringify(tasks.map(t => ({
                id: t._id,
                status: t.status,
                assignedTo: t.assignedTo,
                priority: t.priority,
                slaBreachAt: t.slaBreachAt
            })), null, 2));

            // Check if status matches 'OPEN'
            const openTasks = tasks.filter(t => t.status === 'OPEN');
            console.log(`  - OPEN Tasks: ${openTasks.length}`);
        } else {
            // Check responses to see if any SHOULD have created tasks
            const responses = await Response.find({ tenantId: tenant._id }).limit(5).sort({ createdAt: -1 });
            console.log('  Recent Responses:', JSON.stringify(responses.map(r => ({
                id: r._id,
                metrics: r.metrics
            })), null, 2));
        }
    }

    process.exit(0);
};

debug().catch(console.error);
