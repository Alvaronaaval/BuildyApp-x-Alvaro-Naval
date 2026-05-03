import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export function setupSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token
            || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Token no proporcionado'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch {
            next(new Error('Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[WS] Conectado: ${socket.id} — Usuario: ${socket.user._id}`);

        if (socket.user.company) {
            socket.join(`company:${socket.user.company}`);
        }

        socket.on('disconnect', () => {
            console.log(`[WS] Desconectado: ${socket.id}`);
        });
    });

    return io;
}
