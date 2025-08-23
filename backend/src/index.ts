import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidate.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

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
    console.log(`Server is running on http://localhost:${PORT}`);
});
