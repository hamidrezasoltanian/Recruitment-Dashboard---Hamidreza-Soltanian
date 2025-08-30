

import express from 'express';
import UserModel from '../models/user.model';

// Get current user profile
export const getCurrentUser = async (req: express.Request, res: express.Response) => {
    try {
        // req.user is attached by the authMiddleware
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const user = await UserModel.findById(req.user.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching user profile', error: error.message });
    }
};

// Update current user (e.g., settings)
export const updateCurrentUser = async (req: express.Request, res: express.Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        // Users can only update their own 'name', 'settings' and 'email'
        const { name, settings, email } = req.body;
        const updates: { name?: string; settings?: any; email?: string } = {};
        if (name) updates.name = name;
        if (settings) updates.settings = settings;
        if (email) updates.email = email;

        const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, updates, { new: true });
        res.status(200).json(updatedUser);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating user profile', error: error.message });
    }
};


// --- Admin Only Controllers ---

export const getAllUsers = async (req: express.Request, res: express.Response) => {
    try {
        const users = await UserModel.find().sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

export const createUser = async (req: express.Request, res: express.Response) => {
    try {
        const { username, name, password, isAdmin, email } = req.body;
        
        const existingUser = await UserModel.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            res.status(409).json({ message: 'User with this username already exists' });
            return;
        }

        const newUser = new UserModel({ username, name, password, isAdmin, email });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error: any) {
        if (error.code === 11000) { // Duplicate key error for email
             res.status(409).json({ message: 'User with this email already exists' });
             return;
        }
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

export const updateUser = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const { name, isAdmin, password, email } = req.body;
        
        const userToUpdate = await UserModel.findById(id);
        if (!userToUpdate) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (name) userToUpdate.name = name;
        if (email) userToUpdate.email = email;
        if (typeof isAdmin === 'boolean') userToUpdate.isAdmin = isAdmin;
        if (password) userToUpdate.password = password; // Hashing is handled by the pre-save hook

        const updatedUser = await userToUpdate.save();
        res.status(200).json(updatedUser);

    } catch (error: any) {
         if (error.code === 11000) {
             res.status(409).json({ message: 'User with this email already exists' });
             return;
        }
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

export const deleteUser = async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (req.user?.id === id) {
            res.status(400).json({ message: 'You cannot delete your own account' });
            return;
        }

        const deletedUser = await UserModel.findByIdAndDelete(id);
        if (!deletedUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};