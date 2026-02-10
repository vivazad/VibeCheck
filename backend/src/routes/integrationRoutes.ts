import { Router } from 'express';
import { connectIntegration, syncIntegration } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/connect', connectIntegration);
router.post('/sync', syncIntegration);

export default router;
