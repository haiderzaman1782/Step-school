import { Campus } from '../models/Campus.js';

export const getAllCampuses = async (req, res) => {
    try {
        const campuses = await Campus.findAll();
        res.json(campuses);
    } catch (error) {
        console.error('GetAllCampuses error:', error);
        res.status(500).json({ error: 'Server error fetching campuses' });
    }
};

export const createCampus = async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can create campuses' });
        }
        const campus = await Campus.create(req.body);
        res.status(201).json(campus);
    } catch (error) {
        console.error('CreateCampus error:', error);
        res.status(500).json({ error: 'Failed to create campus' });
    }
};

export const deleteCampus = async (req, res) => {
    try {
        if (req.user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can delete campuses' });
        }
        await Campus.delete(req.params.id);
        res.json({ message: 'Campus deleted' });
    } catch (error) {
        console.error('DeleteCampus error:', error);
        res.status(500).json({ error: 'Failed to delete campus' });
    }
};
