import pool from '../config/database.js';

export const getAccountantMetrics = async (req, res) => {
    try {
        const clientsCount = await pool.query('SELECT COUNT(*) FROM clients WHERE role = $1', ['client']);
        const totalRevenue = await pool.query('SELECT SUM(amount) FROM vouchers WHERE status = $1', ['paid']);
        const pendingAmount = await pool.query('SELECT SUM(amount) FROM vouchers WHERE status = $1', ['pending']);
        const overdueCount = await pool.query('SELECT COUNT(*) FROM vouchers WHERE status = $1 OR (status = $2 AND due_date < CURRENT_DATE)', ['overdue', 'pending']);

        res.json({
            totalClients: parseInt(clientsCount.rows[0].count),
            totalRevenue: parseFloat(totalRevenue.rows[0].sum || 0),
            pendingPayments: parseFloat(pendingAmount.rows[0].sum || 0),
            overduePayments: parseInt(overdueCount.rows[0].count)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getClientMetrics = async (req, res) => {
    try {
        const clientId = req.user.id;
        const totalPaid = await pool.query('SELECT SUM(amount) FROM vouchers WHERE client_id = $1 AND status = $2', [clientId, 'paid']);
        const pendingAmount = await pool.query('SELECT SUM(amount) FROM vouchers WHERE client_id = $1 AND status = $2', [clientId, 'pending']);
        const nextDue = await pool.query('SELECT MIN(due_date) FROM vouchers WHERE client_id = $1 AND status = $2', [clientId, 'pending']);

        res.json({
            totalPaid: parseFloat(totalPaid.rows[0].sum || 0),
            pendingAmount: parseFloat(pendingAmount.rows[0].sum || 0),
            nextDueDate: nextDue.rows[0].min
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
