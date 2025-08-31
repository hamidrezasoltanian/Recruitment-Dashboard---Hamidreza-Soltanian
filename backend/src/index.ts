import express from 'express';
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
    // FIX: Using default import for express resolves type inference issues for app.use()
    app.use(express.json());

    // --- API Routes ---
    const apiRouter = express.Router();

    // Public Routes
    apiRouter.use('/auth', authRoutes);
    // FIX: Explicitly use express types to avoid conflicts with global types.
    apiRouter.get("/health", (req: express.Request, res: express.Response) => {
      res.status(200).json({ status: "ok" });
    });

    // Protected Routes
    apiRouter.use('/candidates', authMiddleware, candidateRoutes);
    apiRouter.use('/users', authMiddleware, userRoutes);
    apiRouter.use('/settings', authMiddleware, settingsRoutes);
    apiRouter.use('/templates', authMiddleware, templateRoutes);
    
    // Mount the master API router
    app.use('/api', apiRouter);


    // API root (for testing if the server is up)
    // FIX: Explicitly use express types to avoid conflicts with global types.
    app.get('/', (req: express.Request, res: express.Response) => {
        res.status(200).send('Recruitment Dashboard API is running!');
    });

    // Start automated services
    startReminderService();

    // Start the server
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
};

startServer().catch(error => {
    console.error("Failed to start server:", error);
});
