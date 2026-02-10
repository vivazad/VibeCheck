// MongoDB initialization script
// This runs when the container is first started

db = db.getSiblingDB('vibecheck');

// Create indexes for better query performance
db.tenants.createIndex({ ownerEmail: 1 }, { unique: true });
db.forms.createIndex({ tenantId: 1, active: 1 });
db.responses.createIndex({ tenantId: 1, createdAt: -1 });
db.responses.createIndex({ tenantId: 1, npsScore: 1 });

print('MongoDB initialization complete');
