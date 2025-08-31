
// FIX: Use direct imports from express to ensure correct type resolution.
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './services/db';
import { startReminderService } from './services/reminder.service';
import { apiRouter } from './routes/index'; 

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

    // --- Serve Frontend Static Files ---
    // This points to the `dist` directory in the `frontend` workspace
    const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDistPath));
    
    // --- API Routes ---
    // All API routes are handled by the master router under the /api prefix
    app.use('/api', apiRouter);
    
    // --- Frontend Catch-all Route ---
    // This route serves the index.html for any request that doesn't match an API route or a static file.
    // This is crucial for client-side routing (e.g., React Router) to work.
    app.get('*', (req: Request, res: Response) => {
        if (!req.originalUrl.startsWith('/api')) {
            res.sendFile(path.join(frontendDistPath, 'index.html'));
        } else {
            // If it's an API route that wasn't found, send a proper 404
            res.status(404).json({ message: 'API endpoint not found' });
        }
    });

    // Start automated services
    startReminderService();

    // Start the server
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
        console.log(`   - Serving frontend from: ${frontendDistPath}`);
        console.log(`   - API endpoints are available under /api`);
    });
};

startServer().catch(error => {
    console.error("Failed to start server:", error);
    // @ts-ignore
    process.exit(1);
});