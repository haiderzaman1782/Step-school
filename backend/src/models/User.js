import pool from '../config/database.js';

export class User {
  static async findAll(params = {}) {
    const { limit = 100, offset = 0, role, status } = params;
    let query = `SELECT 
      u.*,
      u.totalpayments,
      u.totalcalls
    FROM users u
    WHERE 1=1`;
    const values = [];
    let paramCount = 1;

    if (role && role !== 'all') {
      query += ` AND u.role = $${paramCount++}`;
      values.push(role);
    }

    if (status && status !== 'all') {
      query += ` AND u.status = $${paramCount++}`;
      values.push(status);
    }

    query += ` ORDER BY u.createdat DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`SELECT 
      u.*
    FROM users u
    WHERE u.id = $1`, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async create(userData) {
    const {
      fullName,
      fullname,
      email,
      phone,
      role = 'customer',
      status = 'active',
      avatar = null,
    } = userData;

    const finalName = fullName || fullname;

    console.log('Creating user with data:', { finalName, email, phone, role, status, avatar });
    const result = await pool.query(
      `INSERT INTO users (fullname, email, phone, role, status, avatar, lastactivity, createdat)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [finalName, email, phone, role, status, avatar]
    );

    return result.rows[0];
  }

  static async update(id, userData) {
    const {
      fullName,
      fullname,
      email,
      phone,
      role,
      status,
      avatar,
      lastactivity,
    } = userData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    const finalName = fullName || fullname;

    if (finalName !== undefined) {
      updates.push(`fullname = $${paramCount++}`);
      values.push(finalName);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramCount++}`);
      values.push(avatar);
    }
    if (lastactivity !== undefined) {
      updates.push(`lastactivity = $${paramCount++}`);
      values.push(lastactivity);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async updateStats(userId) {
    // Update user statistics based on related records
    const paymentsResult = await pool.query(
      'SELECT COUNT(*) FROM payments WHERE user_id = $1',
      [userId]
    );

    await pool.query(
      `UPDATE users SET totalpayments = $1 WHERE id = $2`,
      [
        parseInt(paymentsResult.rows[0].count),
        userId
      ]
    );
  }
}
