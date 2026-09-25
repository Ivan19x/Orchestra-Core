import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.mjs';
import paymentRoutes from './routes/payment.mjs';
import consultantRoutes from './routes/consultants.mjs';
import bookingRoutes from './routes/bookings.mjs';
import contactRoutes from './routes/contact.mjs';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(helmet());

// Render/Fly/Railway all sit behind a proxy — without this, express-rate-limit
// sees every request as coming from the same proxy IP and rate-limits everyone
// together.
app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, cb) => {
    // No Origin header = a server-to-server call (Safaricom's callback, health
    // checks). Those aren't browser requests, so CORS doesn't apply to them.
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/consultants', consultantRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Orchestra-Core API listening on :${PORT}`));
