
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './services/db';
import { startReminderService } from './services/reminder.service';
import { authMiddleware } from './middleware/auth.middleware';

// Import route handlers directly
import authRoutes from './routes/auth.routes';
import candidateRoutes from './routes/candidate.routes';
import userRoutes from './routes/user.routes';
import settingsRoutes from './routes/settings.routes';
import templateRoutes from './routes/template.routes';

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
    
    // Health check endpoint
    app.get("/api/health", (req: ExpressRequest, res: ExpressResponse) => {
      res.status(200).json({ status: "ok" });
    });
    
    // --- API Routes ---
    app.use('/api/auth', authRoutes);
    app.use('/api/candidates', authMiddleware, candidateRoutes);
    app.use('/api/users', authMiddleware, userRoutes);
    app.use('/api/settings', authMiddleware, settingsRoutes);
    app.use('/api/templates', authMiddleware, templateRoutes);
    
    // API root (for testing if the server is up)
    app.get('/', (req: ExpressRequest, res: ExpressResponse) => {
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
    // @ts-ignore
    process.exit(1);
});
