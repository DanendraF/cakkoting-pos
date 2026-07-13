import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import menuRoutes from './routes/menu.routes';
import ordersRoutes from './routes/orders.routes';
import paymentsRoutes from './routes/payments.routes';
import kitchenRoutes from './routes/kitchen.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // CSP is handled on the frontend (Next.js)
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
// Webhook route MUST use raw body for Midtrans signature verification
// All other routes use JSON
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak request, coba lagi nanti' },
});

// Stricter limit for order creation (prevent spam)
const orderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak pesanan, tunggu sebentar' },
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login, coba lagi nanti' },
});

app.use('/api', generalLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/kitchen/login', authLimiter);
app.use('/api/admin/login', authLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Cak Koting API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[Unhandled Error]', err);
    // SECURITY: Never expose stack traces or internal errors to client
    res.status(500).json({ message: 'Terjadi kesalahan internal, coba lagi nanti' });
  }
);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Cak Koting API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`   CORS Origin  : ${process.env.CORS_ORIGIN ?? 'http://localhost:3000'}`);
  console.log(`   Midtrans     : ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'PRODUCTION' : 'SANDBOX'}\n`);
});

export default app;
