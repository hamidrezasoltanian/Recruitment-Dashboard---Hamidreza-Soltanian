
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './services/db';
import candidateRoutes from './routes/candidate.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import settingsRoutes from './routes/settings.routes';
import templateRoutes from './routes/template.routes';
import { authMiddleware } from './middleware/auth.middleware';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const startServer = async () => {
    // Connect to MongoDB
    await connectDB();

    // Middlewares
    app.use(cors());
    app.use(express.json());

    // --- Public Routes ---
    app.use('/api/auth', authRoutes);

    // --- Protected Routes ---
    app.use('/api/candidates', authMiddleware, candidateRoutes);
    app.use('/api/users', authMiddleware, userRoutes);
    app.use('/api/settings', authMiddleware, settingsRoutes);
    app.use('/api/templates', authMiddleware, templateRoutes);

    // API health check
    app.get('/', (req, res) => {
        res.send('Recruitment Dashboard API is running!');
    });

    // Start the server
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
};

startServer();
