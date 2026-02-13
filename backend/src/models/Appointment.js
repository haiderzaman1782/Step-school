import pool from '../config/database.js';

export class Appointment {
  static async findAll(params = {}) {
    const { limit = 100, offset = 0, status, search } = params;
    let query = 'SELECT * FROM appointments WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status && status !== 'all') {
      query += ` AND status = $${paramCount++}`;
      values.push(status);
    }

    if (search) {
      query += ` AND (patientName ILIKE $${paramCount++} OR service ILIKE $${paramCount++} OR id ILIKE $${paramCount++})`;
      const searchPattern = `%${search}%`;
      values.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(appointmentData) {
    const {
      id,
      patientName,
      phone,
      email,
      service,
      date,
      time,
      assignedAgent,
      status = 'pending',
      paymentStatus = 'pending',
      userId,
    } = appointmentData;

    const result = await pool.query(
      `INSERT INTO appointments 
       (id, patientName, phone, email, service, date, time, assignedAgent, status, paymentStatus, user_id, createdDate, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, patientName, phone, email, service, date, time, assignedAgent, status, paymentStatus, userId]
    );
    return result.rows[0];
  }

  static async update(id, appointmentData) {
    const {
      status,
      service,
      date,
      time,
      assignedAgent,
      paymentStatus,
    } = appointmentData;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (service !== undefined) {
      updates.push(`service = $${paramCount++}`);
      values.push(service);
    }
    if (date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(date);
    }
    if (time !== undefined) {
      updates.push(`time = $${paramCount++}`);
      values.push(time);
    }
    if (assignedAgent !== undefined) {
      updates.push(`assignedAgent = $${paramCount++}`);
      values.push(assignedAgent);
    }
    if (paymentStatus !== undefined) {
      updates.push(`paymentStatus = $${paramCount++}`);
      values.push(paymentStatus);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM appointments WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

