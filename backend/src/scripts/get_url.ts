
import { connectDatabase } from '../config/database.js';
import { Tenant } from '../models/index.js';

async function getUrl() {
    await connectDatabase();
    const tenant = await Tenant.findOne({ ownerEmail: 'demo@vibecheck.com' });
    if (tenant) {
        console.log(`\n🔗 QR Form URL: http://localhost:5173/rate?t=${tenant._id}`);
        console.log(`🇪🇸 Spanish URL:   http://localhost:5173/rate?t=${tenant._id}&lang=es`);
    } else {
        console.log('Tenant not found. Please run npm run seed first.');
    }
    process.exit(0);
}

getUrl();
