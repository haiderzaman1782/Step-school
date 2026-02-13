import { Call } from '../models/Call.js';

export const getAllCalls = async (req, res) => {
  try {
    const { limit = 100, offset = 0, status, callType, search } = req.query;
    const calls = await Call.findAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status,
      callType,
      search,
    });

    res.json({
      calls,
      pagination: {
        total: calls.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
};

export const getCallById = async (req, res) => {
  try {
    const { id } = req.params;
    const call = await Call.findById(id);

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json(call);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch call' });
  }
};

export const createCall = async (req, res) => {
  try {
    const {
      id,
      callerName,
      phoneNumber,
      callType,
      status,
      duration,
      timestamp,
      purpose,
      notes,
      userId,
    } = req.body;

    if (!callerName || !phoneNumber) {
      return res.status(400).json({ error: 'Required fields: callerName, phoneNumber' });
    }

    // Generate ID if not provided
    const callId = id || `LOG${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const call = await Call.create({
      id: callId,
      callerName,
      phoneNumber,
      callType: callType || 'incoming',
      status: status || 'completed',
      duration: duration || '00:00',
      timestamp: timestamp || new Date().toISOString(),
      purpose,
      notes,
      userId,
    });

    res.status(201).json(call);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create call' });
  }
};

export const updateCall = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, duration, purpose, notes } = req.body;

    const call = await Call.update(id, {
      status,
      duration,
      purpose,
      notes,
    });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json(call);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update call' });
  }
};

export const deleteCall = async (req, res) => {
  try {
    const { id } = req.params;
    const call = await Call.delete(id);

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json({ message: 'Call deleted successfully', call });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete call' });
  }
};
