import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import quizCompleteRouter from './routes/quiz-complete';
import postmarkInboundRouter from './routes/postmark-inbound';
import generateGuideRouter from './routes/generate-destination-guide';
import tripsRouter from './routes/trips';
import flightStatusRouter from './routes/flight-status';
import travelProfileRouter from './routes/travel-profile';
import documentsRouter from './routes/documents';

const app = express();
const PORT = parseInt(process.env.RAILWAY_PORT || '3000', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(
  express.json({
    limit: '5mb',
    verify: (_req, _res, buf) => {
      // Raw body for webhook verification
      ((_req as unknown) as Record<string, unknown>).rawBody = buf.toString();
    },
  })
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', quizCompleteRouter);
app.use('/api/webhooks', postmarkInboundRouter);
app.use('/api', generateGuideRouter);
app.use('/api/trips', tripsRouter);
app.use('/api', flightStatusRouter);
app.use('/api/travel-profile', travelProfileRouter);
app.use('/api/documents', documentsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`TravelVault API running on port ${PORT}`);
});

export default app;
