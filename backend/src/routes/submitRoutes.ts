import { Router } from 'express';
import { submitForm } from '../controllers/index.js';
import { orderRateLimiter, submitRateLimiter, validate } from '../middleware/index.js';
import { submitFormSchema } from '../validators/index.js';

const router = Router();

// POST /api/v1/submit - Submit form response
router.post(
    '/',
    submitRateLimiter,
    validate(submitFormSchema),
    orderRateLimiter,
    submitForm
);

export default router;
