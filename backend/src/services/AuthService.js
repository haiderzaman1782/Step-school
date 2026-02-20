import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/database.js';

dotenv.config();

class AuthService {
    constructor() {
        this.staticUsers = [];
        this.refreshStaticUserStore();
    }

    /**
     * Loads static owner from environment variables.
     */
    refreshStaticUserStore() {
        const users = [];
        const ownerEmail = process.env.OWNER_EMAIL || 'admin@stepschool.edu';
        const ownerName = process.env.OWNER_NAME || 'School Administrator';
        const ownerPass = process.env.OWNER_PASSWORD || 'admin123';

        // Add primary (.edu)
        users.push({
            email: ownerEmail,
            password: ownerPass,
            name: ownerName,
            role: 'owner',
            campus_id: null
        });

        // Add fallback (.com) if primary is .edu
        if (ownerEmail.endsWith('.edu')) {
            users.push({
                email: ownerEmail.replace('.edu', '.com'),
                password: ownerPass,
                name: ownerName,
                role: 'owner',
                campus_id: null
            });
        }
        this.staticUsers = users;
    }

    async login(email, password) {
        // 1. Check static users (.env owner)
        const staticUser = this.staticUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (staticUser) {
            let isValid = false;
            if (staticUser.password.startsWith('$2')) {
                isValid = await bcrypt.compare(password, staticUser.password);
            } else {
                isValid = (password === staticUser.password);
            }

            if (isValid) {
                return this.generateAuthResponse(staticUser);
            }
        }

        // 2. Check Database Users (Accountants/Clients)
        const query = `
      SELECT u.*, c.name as client_name 
      FROM users u 
      LEFT JOIN clients c ON u.client_id = c.id 
      WHERE u.email = $1 AND u.status = 'active'
    `;
        const result = await pool.query(query, [email.toLowerCase()]);
        const dbUser = result.rows[0];

        if (dbUser) {
            const isValid = await bcrypt.compare(password, dbUser.password_hash);
            if (isValid) {
                return this.generateAuthResponse({
                    email: dbUser.email,
                    name: dbUser.full_name,
                    role: dbUser.role,
                    campus_id: dbUser.campus_id,
                    client_id: dbUser.client_id
                });
            }
        }

        throw new Error('Invalid email or password');
    }

    generateAuthResponse(user) {
        const token = jwt.sign(
            {
                email: user.email,
                role: user.role,
                name: user.name,
                campus_id: user.campus_id,
                client_id: user.client_id || null
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        return {
            token,
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                campus_id: user.campus_id,
                client_id: user.client_id || null
            }
        };
    }

    validateToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            return null;
        }
    }
}

export default new AuthService();
