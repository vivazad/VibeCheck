import { Router } from 'express';
import { getAnalytics, getResponses } from '../controllers/index.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

// Protected routes - tenant must be authenticated
router.get('/:tenantId', authenticate, getAnalytics);
router.get('/:tenantId/responses', authenticate, getResponses);

export default router;
