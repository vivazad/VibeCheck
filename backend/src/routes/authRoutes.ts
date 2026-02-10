import express from 'express';
import { googleAuth, signup, login, onboarding, logout, getProfile, updateSettings } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/google', googleAuth);
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate, getProfile);
router.put('/settings', authenticate, updateSettings);
router.post('/onboarding', authenticate, onboarding);
router.post('/logout', logout);

export default router;
