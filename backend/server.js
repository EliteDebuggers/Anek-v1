import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';

// Config and routes
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Attach Socket.IO instance to the request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Apply Global Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Apply rate limiter to API requests
app.use('/api/', apiLimiter);

// Mount API Version 1 Routes
app.use('/api/v1', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Anek Civic Network API (v1)',
  });
});

// Catch 404 and forward to error handler
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

// Configure Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Join a room for a specific user to send private notifications/updates
  socket.on('joinUser', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user room user:${userId}`);
  });

  // Join an issue discussion room (to receive comment feeds in real-time)
  socket.on('joinIssue', (issueId) => {
    socket.join(`issue:${issueId}`);
    console.log(`Socket ${socket.id} joined issue discussion room issue:${issueId}`);
  });

  // Leave an issue discussion room
  socket.on('leaveIssue', (issueId) => {
    socket.leave(`issue:${issueId}`);
    console.log(`Socket ${socket.id} left issue discussion room issue:${issueId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Start listening
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
