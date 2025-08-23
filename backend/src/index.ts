import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidate.routes';
import { query } from './services/db';
import { exit } from 'process';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Function to check database connection
const checkDbConnection = async () => {
    try {
        // Run a simple query to check the connection
        await query('SELECT NOW()');
        console.log('✅ Connected to database successfully.');
    } catch (error) {
        console.error('❌ Error connecting to the database:', error);
        console.error('Please check your .env file and ensure the database is running.');
        exit(1); 
    }
};

const startServer = async () => {
    // Ensure DB connection before starting the server
    await checkDbConnection();

    // Middlewares
    app.use(cors());
    app.use(express.json());

    // API Routes
    app.get('/', (req, res) => {
        res.send('Recruitment Dashboard API is running!');
    });

    app.use('/api/candidates', candidateRoutes);

    // Start the server
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
};

startServer();
