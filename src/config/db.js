import mongoose from 'mongoose';

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Conectado a la base de datos');
    } catch (error) {
        console.error('Error conectando a la base de datos:', error.message);
        process.exit(1);
    }
};

export default dbConnect;