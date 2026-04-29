import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
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
app.use('/api/client', clientRoutes);
app.use('/api/project', projectRoutes);

app.get('/api/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    };

    try {
        await mongoose.connection.db.admin().ping();
        health.database = 'connected';
    } catch {
        health.status = 'error';
        health.database = 'disconnected';
        return res.status(503).json(health);
    }

    res.json(health);
});

app.use(notFound);
app.use(errorHandler);

export default app;