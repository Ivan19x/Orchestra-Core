import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.mjs';
import paymentRoutes from './routes/payment.mjs';

const app = express();
const PORT = process.env.PORT || 3001;

// The Electron app's bundled local server always runs on this fixed port
// (see SERVER_PORT in electron/main.cjs) — its origin must always be allowed
// regardless of what CORS_ORIGINS is set to for the website, otherwise every
// app install silently loses the ability to call the backend whenever
// CORS_ORIGINS gets updated to just the production website URL.
const ELECTRON_APP_ORIGIN = 'http://localhost:5175';

const allowedOrigins = [
  ELECTRON_APP_ORIGIN,
  ...(process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
];

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

// Raw body needed for webhook signature check — must come before json()
app.use('/api/payment/webhook', express.raw({ type: '*/*' }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) req.body = JSON.parse(req.body.toString());
  next();
});

app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Orchestra-Core API listening on :${PORT}`));
