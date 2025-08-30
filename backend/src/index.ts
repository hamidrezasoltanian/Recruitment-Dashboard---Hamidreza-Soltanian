import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './services/db';
import candidateRoutes from './routes/candidate.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import settingsRoutes from './routes/settings.routes';
import templateRoutes from './routes/template.routes';
import { startReminderService } from './services/reminder.service';
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

    // --- Health Check ---
    app.get("/api/health", (req: Request, res: Response) => {
      // FIX: Removed process.uptime() due to potential @types/node issues.
      res.status(200).json({ status: "ok" });
    });

    // --- Protected Routes ---
    app.use('/api/candidates', authMiddleware, candidateRoutes);
    app.use('/api/users', authMiddleware, userRoutes);
    app.use('/api/settings', authMiddleware, settingsRoutes);
    app.use('/api/templates', authMiddleware, templateRoutes);

    // API root
    app.get('/', (req: Request, res: Response) => {
        // FIX: Added explicit status code.
        res.status(200).send('Recruitment Dashboard API is running!');
    });

    // Start automated services
    startReminderService();

    // Start the server
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
};

// FIX: Catch fatal startup errors and exit gracefully.
startServer().catch(error => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
