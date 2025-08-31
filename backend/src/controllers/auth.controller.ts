

import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import UserModel, { IUser } from '../models/user.model';
import jwt from 'jsonwebtoken';

const generateToken = (user: IUser) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in .env file.');
    }
    return jwt.sign({ id: user._id, isAdmin: user.isAdmin }, jwtSecret, { expiresIn: '1d' });
};

export const register = async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { username, name, password, isAdmin } = req.body;
        if (!username || !name || !password) {
            res.status(400).json({ message: 'Username, name, and password are required' });
            return;
        }

        const existingUser = await UserModel.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            res.status(409).json({ message: 'User with this username already exists' });
            return;
        }

        const newUser = new UserModel({ username, name, password, isAdmin });
        await newUser.save();
        
        const userForResponse = newUser.toJSON();

        res.status(201).json({ user: userForResponse });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

export const login = async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        }

        const user = await UserModel.findOne({ username: username.toLowerCase() }).select('+password');
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        
        const token = generateToken(user);
        const userForResponse = user.toJSON();

        res.status(200).json({ token, user: userForResponse });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};
