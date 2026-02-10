import { Router } from 'express';
import { generateQR, verifyQR } from '../controllers/index.js';

const router = Router();

// Public routes for QR generation
router.get('/generate', generateQR);
router.get('/verify', verifyQR);

export default router;
