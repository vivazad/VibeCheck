import { Router } from 'express';
import { getActiveForm, getTenantForms, createForm, updateForm } from '../controllers/index.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

// Public route - get active form for tenant
router.get('/public/:tenantId', getActiveForm);

// Protected routes
router.get('/', authenticate, getTenantForms);
router.post('/', authenticate, createForm);
router.put('/:formId', authenticate, updateForm);

export default router;
