import { Router } from 'express';
import { upload, handleUpload } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Protected route for uploads
router.post('/', authenticate, upload.single('file'), handleUpload);

export default router;
