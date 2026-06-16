import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiting (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // limit each IP to 60 requests per windowMs (safe for team environment)
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 uploads per minute
  message: {
    success: false,
    error: 'Too many file uploads, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Candidate operations rate limiting
export const candidateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // limit each IP to 200 candidate operations per 5 minutes
  message: {
    success: false,
    error: 'Too many candidate operations, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Comment operations rate limiting
export const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 comment operations per 5 minutes
  message: {
    success: false,
    error: 'Too many comment operations, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Analytics rate limiting
export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 analytics requests per minute
  message: {
    success: false,
    error: 'Too many analytics requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Monitoring rate limiting
export const monitoringLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 monitoring requests per minute
  message: {
    success: false,
    error: 'Too many monitoring requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin operations rate limiting
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 admin operations per 5 minutes
  message: {
    success: false,
    error: 'Too many admin operations, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a custom rate limiter with Redis store (optional)
export const createRedisLimiter = (options: {
  windowMs: number;
  max: number;
  message: any;
  prefix?: string;
}) => {
  return rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Apply rate limiting middleware
export const applyRateLimit = (app: any) => {
  if (app && typeof app.use === 'function') {
    app.use(generalLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/files', uploadLimiter);
    app.use('/api/candidates', candidateLimiter);
    app.use('/api/comments', commentLimiter);
    app.use('/api/analytics', analyticsLimiter);
    app.use('/api/monitoring', monitoringLimiter);
    app.use('/api/admin', adminLimiter);
  }
};