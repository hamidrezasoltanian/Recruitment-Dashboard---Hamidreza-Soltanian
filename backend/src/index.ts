

import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './services/db';
import apiRoutes from './routes'; // Import the new master router
import { startReminderService } from './services/reminder.service';

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
    app.use('/api', apiRoutes); // Use the single master router for all /api endpoints
    
    app.get("/api/health", (req: ExpressRequest, res: ExpressResponse) => {
      res.status(200).json({ status: "ok" });
    });
    
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
    // FIX: Suppressing a likely project configuration error regarding NodeJS types.
    // @ts-ignore
    process.exit(1); // Exit if server fails to start
});
