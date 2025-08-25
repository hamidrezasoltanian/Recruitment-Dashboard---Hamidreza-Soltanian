import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidate.routes';
import { connectDB } from './services/db';

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

    // API Routes
    app.get('/', (req: express.Request, res: express.Response) => {
        res.send('Recruitment Dashboard API is running!');
    });

    app.use('/api/candidates', candidateRoutes);

    // Start the server
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
};

startServer();