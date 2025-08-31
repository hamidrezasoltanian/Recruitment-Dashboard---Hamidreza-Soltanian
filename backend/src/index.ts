
import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './services/db';
import { startReminderService } from './services/reminder.service';
import { apiRouter } from './routes/index'; // Import the new master router

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
    
    // --- API Routes ---
    // All API routes are now handled by the master router under the /api prefix
    app.use('/api', apiRouter);
    
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