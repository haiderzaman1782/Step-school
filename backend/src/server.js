import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config/database.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:5174', 'https://step-school.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Normalize incoming origin by removing trailing slash
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Check if origin is in allowed list or if all are allowed
    const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin);

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: "${origin}" (normalized: "${normalizedOrigin}") against list: ${JSON.stringify(allowedOrigins)}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
// Increase payload size limit to handle file uploads (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const origin = req.get('Origin') || 'No Origin';
  const method = req.method;
  const url = req.url;

  // Log request
  console.log(`\n>>> [${new Date().toISOString()}] ${method} ${url}`);
  console.log(`    Origin: ${origin}`);
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '********';
    console.log(`    Body: ${JSON.stringify(sanitizedBody, null, 2)}`);
  }

  // Intercept response finish to log status and duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`<<< [${new Date().toISOString()}] ${method} ${url} - Status: ${res.statusCode} (${duration}ms)`);
  });

  next();
});
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Ensure CORS headers are present even in errors
  const origin = req.get('Origin');
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  console.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Database connection test and server start
const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully.');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();