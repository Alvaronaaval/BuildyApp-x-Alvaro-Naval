import User from '../models/User.js';
import { verifyToken } from '../utils/handleJwt.js';
import { AppError } from '../utils/AppError.js';

export const authMiddleware = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            throw AppError.unauthorized('No hay token de autenticación');
        }

        const token = req.headers.authorization.split(' ').pop();
        const dataToken = verifyToken(token);

        if (!dataToken || !dataToken._id) {
            throw AppError.unauthorized('Token inválido o expirado');
        }

        const user = await User.findById(dataToken._id);

        if (!user) {
            throw AppError.unauthorized('Usuario no encontrado');
        }

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};