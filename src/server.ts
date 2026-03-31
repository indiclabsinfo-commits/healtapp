import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import path from 'path';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import counsellorRoutes from './routes/counsellors';
import categoryRoutes from './routes/categories';
import levelRoutes from './routes/levels';
import questionRoutes from './routes/questions';
import questionnaireRoutes from './routes/questionnaires';
import assessmentRoutes from './routes/assessments';
import theoryRoutes from './routes/theory';
import moodRoutes from './routes/mood';
import breathingRoutes from './routes/breathing';
import analyticsRoutes from './routes/analytics';
import orgRoutes from './routes/organizations';
import behaviorLogRoutes from './routes/behaviorLogs';
import consultationRoutes from './routes/consultations';
import assignmentRoutes from './routes/assignments';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
const isDev = process.env.NODE_ENV !== 'production';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 200, // Relaxed in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.', code: 'RATE_LIMITED' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 20, // Relaxed in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, please try again later.', code: 'RATE_LIMITED' },
});

app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authLimiter);

// Static files (uploaded photos, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/counsellors', counsellorRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/levels', levelRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/questionnaires', questionnaireRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/theory-sessions', theoryRoutes);
app.use('/api/v1/mood', moodRoutes);
app.use('/api/v1/breathing-exercises', breathingRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/organizations', orgRoutes);
app.use('/api/v1/behavior-logs', behaviorLogRoutes);
app.use('/api/v1/consultations', consultationRoutes);
app.use('/api/v1/assignments', assignmentRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MindCare API running on http://localhost:${PORT}`);
});

export default app;
