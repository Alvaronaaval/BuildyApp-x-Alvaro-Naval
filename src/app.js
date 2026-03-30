import express from 'express';
import helmet from 'helmet';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', mensaje: 'Servidor BildyApp funcionando' });
});

app.use('/api/user', userRoutes);

export default app;