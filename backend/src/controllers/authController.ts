import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User, Tenant } from '../models/index.js';
import { Types } from 'mongoose';
import { config } from '../config/index.js';

// Google client instantiation moved to handler
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Removed local JWT_SECRET, using config.jwtSecret instead

// Check for Google config but don't crash
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    console.warn('⚠️  Google Auth config missing (GOOGLE_CLIENT_ID, etc). Google login will fail.');
}
const generateToken = (user: any) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role,
            tenantId: user.tenantId, // Might be undefined during onboarding
        },
        config.jwtSecret,
        { expiresIn: '7d' }
    );
};

// POST /auth/google
// POST /auth/google
export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!process.env.GOOGLE_CLIENT_ID) {
            throw new Error('GOOGLE_CLIENT_ID is not configured');
        }

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }

        const { email, name, sub: googleId, picture } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            // New User
            user = await User.create({
                email,
                name,
                googleId,
                role: 'admin',
                status: 'pending_onboarding',
            });
        } else {
            // Existing User - Link Google ID if missing
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        }

        const jwtToken = generateToken(user);

        // HttpOnly Cookie
        res.cookie('token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId ? user.tenantId.toString() : undefined,
                status: user.status,
                picture,
            },
            token: jwtToken
        });
    } catch (error: any) {
        console.error('Google Auth Error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: error.message
        });
    }
};

// POST /auth/signup (Email/Password)
export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            email,
            passwordHash,
            name,
            role: 'admin', // First user is admin
            status: 'pending_onboarding',
        });

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId ? user.tenantId.toString() : undefined,
                status: user.status,
            },
            token,
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
};

// POST /auth/login (Email/Password)
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId ? user.tenantId.toString() : undefined,
                status: user.status,
            },
            token,
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// POST /auth/onboarding
export const onboarding = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId; // From auth middleware
        const { businessName, logoUrl } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.tenantId) {
            return res.status(400).json({ error: 'User already has a tenant' });
        }

        // Check if tenant already exists for this email (recovery scenario)
        let tenant = await Tenant.findOne({ ownerEmail: user.email });

        if (!tenant) {
            // Create Tenant
            const dummyHash = await bcrypt.hash(Math.random().toString(), 10);
            tenant = await Tenant.create({
                name: businessName,
                ownerEmail: user.email,
                ownerPhone: 'N/A', // Update later
                passwordHash: dummyHash,
                themeConfig: {
                    logoUrl,
                    primaryColor: '#6366f1',
                },
            });
        } else {
            // Update tenant details if provided
            if (businessName) tenant.name = businessName;
            if (logoUrl) tenant.themeConfig.logoUrl = logoUrl;
            await tenant.save();
        }

        // Update User
        user.tenantId = tenant._id as Types.ObjectId;
        user.status = 'active';
        await user.save();

        // Re-issue token with tenantId
        const newToken = generateToken(user);
        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            user: {
                id: user._id,
                tenantId: tenant._id.toString(),
                status: 'active',
            },
            tenant,
            token: newToken,
        });
    } catch (error) {
        console.error('Onboarding Error:', error);
        res.status(500).json({ error: 'Onboarding failed' });
    }
};

// POST /auth/logout
export const logout = async (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out' });
};

// GET /auth/me
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const user = await User.findById(userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let tenant = null;
        if (user.tenantId) {
            tenant = await Tenant.findById(user.tenantId).select('-passwordHash');
        }

        res.json({
            success: true,
            data: {
                user,
                tenant
            }
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};

// PUT /auth/settings
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { themeConfig, settings } = req.body;

        const user = await User.findById(userId);
        if (!user || !user.tenantId) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        const tenant = await Tenant.findById(user.tenantId);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        if (themeConfig) {
            tenant.themeConfig = { ...tenant.themeConfig, ...themeConfig };
        }

        if (settings) {
            tenant.settings = { ...tenant.settings, ...settings };
        }

        await tenant.save();

        res.json({
            success: true,
            data: { tenant }
        });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
