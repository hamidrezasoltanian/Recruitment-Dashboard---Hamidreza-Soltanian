import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { webSocketService } from './services/websocketService';
import { monitoringService, requestTrackingMiddleware } from './services/monitoringService';
import { applyRateLimit } from './middleware/rateLimiting';

// Load environment variables - try env.local first, then .env
// In TypeScript source, __dirname will be src/, so we go up one level
// In compiled JS, __dirname will be dist/, so we go up two levels
const envPath = path.resolve(process.cwd(), 'env.local');
console.log('Loading env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn('Failed to load env.local, trying .env:', result.error.message);
}
dotenv.config(); // This will load .env if env.local doesn't have all vars
console.log('PORT from env:', process.env.PORT);

const app = express();
app.set('trust proxy', 1);
const prisma = new PrismaClient();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Apply rate limiting
applyRateLimit(app);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request tracking middleware
app.use(requestTrackingMiddleware);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import routes
import apiRoutes from './routes';

// API routes
app.use('/api', apiRoutes);

// Root route handler - redirect to frontend with token if provided
app.get('/', (req, res) => {
  const token = req.query.token;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
  
  if (token) {
    // Redirect to frontend with token
    return res.redirect(`${frontendUrl}/?token=${token}`);
  }
  
  // If no token, return API info
  res.json({
    message: 'Recruitment Dashboard API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api'
    },
    frontend: frontendUrl
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'حجم فایل بیش از حد مجاز است'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'فیلد فایل غیرمنتظره'
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'خطای داخلی سرور'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'مسیر یافت نشد'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
webSocketService.initialize(server);

// Start server
// Force port 3002 for Recruitment Dashboard Backend
const PORT = parseInt(process.env.PORT || '3002', 10);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔌 WebSocket enabled at ws://localhost:${PORT}/ws`);
});

export default app;
