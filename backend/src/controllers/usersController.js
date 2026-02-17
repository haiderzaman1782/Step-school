import { User } from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to get avatar URL from file path
const getAvatarUrl = (filename) => {
  if (!filename) return null;
  // If it's already a URL, return it
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  // Return relative path that will be served by static middleware
  return `/uploads/avatars/${filename}`;
};

// Helper function to delete old avatar file
const deleteAvatarFile = async (avatarPath) => {
  if (!avatarPath) return;

  // Extract filename from path
  const filename = avatarPath.includes('/') ? avatarPath.split('/').pop() : avatarPath;
  const filePath = path.join(__dirname, '../../uploads/avatars', filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    // Error deleting avatar file
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { limit = 100, offset = 0, role, status } = req.query;
    const users = await User.findAll({ limit: parseInt(limit), offset: parseInt(offset), role, status });

    // Transform avatar paths to URLs
    const usersWithAvatarUrls = users.map(user => ({
      ...user,
      avatar: getAvatarUrl(user.avatar)
    }));

    res.json({
      users: usersWithAvatarUrls,
      pagination: {
        total: users.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform avatar path to URL
    res.json({
      ...user,
      avatar: getAvatarUrl(user.avatar)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, fullName, email, phone, role, status } = req.body;

    // Handle file upload - avatar file will be in req.file
    let avatarFilename = null;
    if (req.file) {
      avatarFilename = req.file.filename;
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      // Delete uploaded file if user already exists
      if (req.file) {
        await deleteAvatarFile(req.file.filename);
      }
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    console.log(`[UsersController] Creating user for email: ${email}`);
    const user = await User.create({
      fullName: fullName || name,
      email,
      phone,
      role: role || 'customer',
      status: status || 'active',
      avatar: avatarFilename, // Store filename instead of base64
    });
    console.log(`[UsersController] User created successfully with ID: ${user.id}`);

    res.status(201).json({
      ...user,
      avatar: getAvatarUrl(user.avatar)
    });
  } catch (error) {
    console.error('Error creating user in controller:', error);
    // Delete uploaded file on error
    if (req.file) {
      await deleteAvatarFile(req.file.filename);
    }
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fullName, email, phone, role, status } = req.body;

    // Get current user to check for old avatar
    const currentUser = await User.findById(id);
    if (!currentUser) {
      // Delete uploaded file if user doesn't exist
      if (req.file) {
        await deleteAvatarFile(req.file.filename);
      }
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle file upload - avatar file will be in req.file
    let avatarFilename = currentUser.avatar; // Keep existing avatar by default
    if (req.file) {
      avatarFilename = req.file.filename;
      // Delete old avatar file if it exists
      if (currentUser.avatar) {
        await deleteAvatarFile(currentUser.avatar);
      }
    }

    console.log(`[UsersController] Updating user ID: ${id}`);
    const user = await User.update(id, {
      fullName: fullName || name,
      email,
      phone,
      role,
      status,
      avatar: avatarFilename, // Store filename instead of base64
    });
    console.log(`[UsersController] User updated successfully: ${id}`);

    res.json({
      ...user,
      avatar: getAvatarUrl(user.avatar)
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      await deleteAvatarFile(req.file.filename);
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete avatar file if it exists
    if (user.avatar) {
      await deleteAvatarFile(user.avatar);
    }

    console.log(`[UsersController] Deleting user ID: ${id}`);
    const deletedUser = await User.delete(id);
    console.log(`[UsersController] User deleted successfully: ${id}`);

    res.json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

