export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vibecheck',
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    hmacSecret: process.env.HMAC_SECRET || 'dev-hmac-secret',
    frontendUrl: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
    whatsappApiUrl: process.env.WHATSAPP_API_URL || 'https://api.whatsapp.mock/v1/messages',
    whatsappApiToken: process.env.WHATSAPP_API_TOKEN || 'mock-token',
} as const;
