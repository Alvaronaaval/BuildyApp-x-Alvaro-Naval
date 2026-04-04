import app from './app.js';
import dbConnect from './config/db.js';

const port = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await dbConnect();
        app.listen(port, () => {
            console.log(`Servidor inicializado en el puerto ${port}. Modo: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Error fatal al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();