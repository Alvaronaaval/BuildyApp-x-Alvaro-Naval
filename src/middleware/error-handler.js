import { AppError } from '../utils/AppError.js';
import loggerService from '../services/logger.service.js';

export const notFound = (req, res, next) => {
    next(AppError.notFound(`Ruta ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {

    console.error('ERROR REAL CAPTURADO:', err);

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            error: true,
            message: err.message,
            code: err.code
        });
    }

    if (err.name === 'ZodError') {
        const details = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));
        return res.status(400).json({
            error: true,
            message: 'Error de validación',
            code: 'VALIDATION_ERROR',
            details
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            error: true,
            message: 'El registro ya existe',
            code: 'DUPLICATE_KEY'
        });
    }

    loggerService.logError(err, req);

    res.status(500).json({
        error: true,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
    });
};