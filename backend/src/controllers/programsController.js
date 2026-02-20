import { Program } from '../models/Program.js';
import { SchoolClient } from '../models/SchoolClient.js';

/**
 * Helper – verify client belongs to this accountant's campus.
 */
const assertCampusAccess = async (clientId, campusId) => {
    const client = await SchoolClient.findById(clientId);
    if (!client) return { error: 'Client not found', status: 404 };
    if (client.campus_id !== campusId) return { error: 'Cannot access clients from other campuses', status: 403 };
    return { client };
};

// ──────────────────────────────────────────────────────────
// POST /api/school-clients/:clientId/programs
// ──────────────────────────────────────────────────────────
export const addProgram = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { program_name, seat_count } = req.body;

        if (!program_name) return res.status(400).json({ error: 'program_name is required' });
        if (!seat_count || parseInt(seat_count) <= 0) {
            return res.status(400).json({ error: 'seat_count must be greater than 0' });
        }

        const access = await assertCampusAccess(clientId, req.user.campus_id);
        if (access.error) return res.status(access.status).json({ error: access.error });

        const program = await Program.create({
            client_id: clientId,
            program_name,
            seat_count: parseInt(seat_count),
        });

        // Return updated client (trigger recalculated totals)
        const updatedClient = await SchoolClient.findById(clientId);
        res.status(201).json({ program, client: updatedClient });
    } catch (err) {
        console.error('addProgram:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// PUT /api/school-clients/:clientId/programs/:programId
// ──────────────────────────────────────────────────────────
export const updateProgram = async (req, res) => {
    try {
        const { clientId, programId } = req.params;
        const { program_name, seat_count } = req.body;

        const access = await assertCampusAccess(clientId, req.user.campus_id);
        if (access.error) return res.status(access.status).json({ error: access.error });

        const existing = await Program.findById(programId);
        if (!existing || existing.client_id !== clientId) {
            return res.status(404).json({ error: 'Program not found' });
        }

        if (seat_count !== undefined && parseInt(seat_count) <= 0) {
            return res.status(400).json({ error: 'seat_count must be greater than 0' });
        }

        await Program.update(programId, {
            program_name,
            seat_count: seat_count !== undefined ? parseInt(seat_count) : undefined,
        });

        const updatedClient = await SchoolClient.findById(clientId);
        res.json({ program: await Program.findById(programId), client: updatedClient });
    } catch (err) {
        console.error('updateProgram:', err);
        res.status(500).json({ error: err.message });
    }
};

// ──────────────────────────────────────────────────────────
// DELETE /api/school-clients/:clientId/programs/:programId
// ──────────────────────────────────────────────────────────
export const deleteProgram = async (req, res) => {
    try {
        const { clientId, programId } = req.params;

        const access = await assertCampusAccess(clientId, req.user.campus_id);
        if (access.error) return res.status(access.status).json({ error: access.error });

        // Must keep at least 1 program
        const count = await Program.countByClientId(clientId);
        if (count <= 1) {
            return res.status(400).json({ error: 'Client must have at least one program' });
        }

        const existing = await Program.findById(programId);
        if (!existing || existing.client_id !== clientId) {
            return res.status(404).json({ error: 'Program not found' });
        }

        await Program.delete(programId);
        const updatedClient = await SchoolClient.findById(clientId);
        res.json({ message: 'Program deleted', client: updatedClient });
    } catch (err) {
        console.error('deleteProgram:', err);
        res.status(500).json({ error: err.message });
    }
};
