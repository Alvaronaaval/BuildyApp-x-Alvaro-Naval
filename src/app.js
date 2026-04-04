import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/user.routes.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { sanitizeBody } from './middleware/sanitize.js';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(sanitizeBody);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: true, message: 'Demasiadas peticiones' }
});

app.use('/api', limiter);

app.use('/api/user', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;