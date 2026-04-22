import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { runMigrations } from './db/migrations';
import { surveyRouter } from './survey/router';
import { adminRouter } from './admin/router';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50kb' }));

app.use(
  '/survey',
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use('/survey', surveyRouter);
app.use('/admin', adminRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

async function start() {
  await runMigrations();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
