import { AppError } from '../utils/AppError.js';

export const roleMiddleware = (roles) => (req, res, next) => {
    try {
        const { user } = req;

        if (!roles.includes(user.role)) {
            throw AppError.forbidden('No tienes permisos para realizar esta acción');
        }

        next();
    } catch (err) {
        next(err);
    }
};