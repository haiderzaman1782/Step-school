import pool from '../config/database.js';

export class Payment {
  static async findAll(params = {}) {
    const { limit = 100, offset = 0, status, search } = params;
    let query = 'SELECT * FROM payments WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status && status !== 'all') {
      query += ` AND status = $${paramCount++}`;
      values.push(status);
    }

    if (search) {
      query += ` AND (customername ILIKE $${paramCount++} OR id ILIKE $${paramCount++} OR transactionid ILIKE $${paramCount++})`;
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY date DESC, timestamp DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByTransactionId(transactionId) {
    const result = await pool.query('SELECT * FROM payments WHERE transactionid = $1', [transactionId]);
    return result.rows[0];
  }

  static async create(paymentData) {
    const {
      id,
      transactionId,
      transactionid,
      customerName,
      customername,
      paymentMethod,
      paymentmethod,
      amount,
      status = 'pending',
      date,
      timestamp,
      refundStatus,
      refundstatus,
      service,
      userId,
      user_id,
      invoicenumber,
      callreference,
      failurereason,
    } = paymentData;

    const finalTransactionId = transactionId || transactionid || `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const finalId = id || `PAY${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const finalCustomerName = customerName || customername;
    const finalPaymentMethod = paymentMethod || paymentmethod;
    const finalRefundStatus = refundStatus || refundstatus;
    const finalUserId = userId || user_id;

    const result = await pool.query(
      `INSERT INTO payments 
       (id, transactionid, customername, paymentmethod, amount, status, date, timestamp, refundstatus, service, user_id, invoicenumber, callreference, failurereason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [finalId, finalTransactionId, finalCustomerName, finalPaymentMethod, amount, status, date, timestamp, finalRefundStatus, service, finalUserId, invoicenumber, callreference, failurereason]
    );
    return result.rows[0];
  }

  static async update(id, paymentData) {
    const {
      status,
      refundStatus,
      refundstatus,
      failureReason,
      failurereason,
    } = paymentData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    const finalRefundStatus = refundStatus !== undefined ? refundStatus : refundstatus;
    const finalFailureReason = failureReason !== undefined ? failureReason : failurereason;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (finalRefundStatus !== undefined) {
      updates.push(`refundstatus = $${paramCount++}`);
      values.push(finalRefundStatus);
    }
    if (finalFailureReason !== undefined) {
      updates.push(`failurereason = $${paramCount++}`);
      values.push(finalFailureReason);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

