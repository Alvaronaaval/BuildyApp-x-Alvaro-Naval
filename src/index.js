import app from './app.js';
import dbConnect from './config/db.js';
import mongoose from 'mongoose';

const port = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await dbConnect();
        const server = app.listen(port, () => {
            console.log(`Servidor inicializado en el puerto ${port}. Modo: ${process.env.NODE_ENV}`);
        });

        const shutdown = async (signal) => {
            console.log(`${signal} recibido. Cerrando servidor...`);
            server.close(async () => {
                console.log('Servidor HTTP cerrado');
                await mongoose.connection.close();
                console.log('MongoDB desconectado');
                process.exit(0);
            });

            // Forzar cierre si tarda más de 10s
            setTimeout(() => process.exit(1), 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('Error fatal al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();