import { Router } from 'express';
import { getTasks, resolveTask, quickResolve, reassignTask } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public route for Magic Link (Quick Resolve)
// Note: In real world, use a signed token in URL to secure this
router.get('/:id/quick-resolve', quickResolve);
router.get('/:id/contact', (req, res) => res.send('Contact Customer feature pending implementation'));

// Protected Routes
router.use(authenticate);

router.get('/', getTasks);
router.post('/:id/resolve', resolveTask);
router.post('/:id/reassign', reassignTask);
// Alias for consistency
router.post('/:id/update', resolveTask);

export default router;
