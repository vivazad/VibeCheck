import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Set environment variables for tests
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
    process.env.HMAC_SECRET = 'test-hmac-secret-for-testing';
    process.env.MONGODB_URI = mongoUri;

    await mongoose.connect(mongoUri);
});

// Cleanup after each test
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Teardown after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// Test timeout is set in jest.config.js
