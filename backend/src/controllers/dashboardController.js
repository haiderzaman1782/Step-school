import pool from '../config/database.js';

export const getAccountantMetrics = async (req, res) => {
    try {
        const campusId = req.user.role === 'accountant' ? req.user.campus_id : null;

        let clientQuery = 'SELECT COUNT(*) FROM clients';
        let voucherQuery = 'SELECT status, SUM(amount) as total_amt, SUM(amount_paid) as total_paid FROM vouchers';
        const params = [];

        if (campusId) {
            clientQuery += ' WHERE campus_id = $1';
            voucherQuery += ' WHERE campus_id = $1';
            params.push(campusId);
        }

        voucherQuery += ' GROUP BY status';

        const clientsCount = await pool.query(clientQuery, params);
        const voucherStats = await pool.query(voucherQuery, params);

        let totalRevenue = 0;
        let pendingAmount = 0;
        let totalPaid = 0;

        voucherStats.rows.forEach(row => {
            totalRevenue += parseFloat(row.total_amt || 0);
            totalPaid += parseFloat(row.total_paid || 0);
            if (row.status !== 'paid' && row.status !== 'cancelled') {
                pendingAmount += (parseFloat(row.total_amt || 0) - parseFloat(row.total_paid || 0));
            }
        });

        res.json({
            totalClients: parseInt(clientsCount.rows[0].count),
            totalRevenue: totalRevenue,
            totalPaid: totalPaid,
            pendingPayments: pendingAmount,
            chartData: voucherStats.rows.map(r => ({
                name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
                value: parseFloat(r.total_amt || 0)
            }))
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getClientMetrics = async (req, res) => {
    try {
        const clientId = req.user.client_id;
        if (!clientId) return res.status(400).json({ error: 'No client associated' });

        const stats = await pool.query(`
            SELECT 
                SUM(amount) as total_amount,
                SUM(amount_paid) as total_paid,
                status
            FROM vouchers 
            WHERE client_id = $1
            GROUP BY status
        `, [clientId]);

        let totalAmount = 0;
        let totalPaid = 0;
        let pendingAmount = 0;

        stats.rows.forEach(row => {
            totalAmount += parseFloat(row.total_amount || 0);
            totalPaid += parseFloat(row.total_paid || 0);
            if (row.status !== 'paid' && row.status !== 'cancelled') {
                pendingAmount += (parseFloat(row.total_amount || 0) - parseFloat(row.total_paid || 0));
            }
        });

        res.json({
            totalAmount,
            totalPaid,
            pendingAmount,
            chartData: stats.rows.map(r => ({
                name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
                value: parseFloat(r.total_amount || 0)
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
