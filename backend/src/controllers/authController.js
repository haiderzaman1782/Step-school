import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Client } from '../models/Client.js';
import dotenv from 'dotenv';

dotenv.config();

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await Client.findByEmail(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar_url
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await Client.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role,
            avatar: user.avatar_url
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
