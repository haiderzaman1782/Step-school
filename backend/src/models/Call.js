import pool from '../config/database.js';

export class Call {
  static async findAll(params = {}) {
    const { limit = 100, offset = 0, status, callType, search } = params;
    let query = 'SELECT * FROM calls WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status && status !== 'all') {
      query += ` AND status = $${paramCount++}`;
      values.push(status);
    }

    if (callType && callType !== 'all') {
      query += ` AND callType = $${paramCount++}`;
      values.push(callType);
    }

    if (search) {
      query += ` AND (callerName ILIKE $${paramCount++} OR phoneNumber ILIKE $${paramCount++} OR purpose ILIKE $${paramCount++})`;
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM calls WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(callData) {
    const {
      id,
      callerName,
      phoneNumber,
      callType,
      status = 'completed',
      duration,
      timestamp,
      purpose,
      notes,
      userId,
    } = callData;

    const result = await pool.query(
      `INSERT INTO calls 
       (id, callerName, phoneNumber, callType, status, duration, timestamp, purpose, notes, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, callerName, phoneNumber, callType, status, duration, timestamp, purpose, notes, userId]
    );
    return result.rows[0];
  }

  static async update(id, callData) {
    const {
      status,
      duration,
      purpose,
      notes,
    } = callData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (duration !== undefined) {
      updates.push(`duration = $${paramCount++}`);
      values.push(duration);
    }
    if (purpose !== undefined) {
      updates.push(`purpose = $${paramCount++}`);
      values.push(purpose);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE calls SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM calls WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

