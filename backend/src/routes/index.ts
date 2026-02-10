import { Router } from 'express';
import authRoutes from './authRoutes.js';
import submitRoutes from './submitRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import qrRoutes from './qrRoutes.js';
import formRoutes from './formRoutes.js';
import exportRoutes from './exportRoutes.js';
import storeRoutes from './storeRoutes.js';
import taskRoutes from './taskRoutes.js';
import integrationRoutes from './integrationRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/submit', submitRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/qr', qrRoutes);
router.use('/forms', formRoutes);
router.use('/export', exportRoutes);
router.use('/stores', storeRoutes);
router.use('/tasks', taskRoutes);
router.use('/integrations', integrationRoutes);
router.use('/upload', uploadRoutes);

// Health check
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
