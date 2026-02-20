import AuthService from '../services/AuthService.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await AuthService.login(email, password);
        res.json(result);
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message || 'Authentication failed' });
    }
};

export const getMe = async (req, res) => {
    try {
        // In the simplified model, user info is in the token/req.user
        // No need to query the database since users table is gone.
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        res.json({
            fullName: req.user.name,
            email: req.user.email,
            role: req.user.role,
            campus_id: req.user.campus_id || null,
            client_id: req.user.client_id || null
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
