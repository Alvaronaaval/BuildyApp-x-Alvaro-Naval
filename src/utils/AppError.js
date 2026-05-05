export class AppError extends Error {
    constructor(message, statusCode = 500, code = 'APP_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }

    static badRequest(message, code = 'BAD_REQUEST') {
        return new AppError(message, 400, code);
    }

    static unauthorized(message, code = 'UNAUTHORIZED') {
        return new AppError(message, 401, code);
    }

    static notFound(message = 'Recurso no encontrado', code = 'NOT_FOUND') {
        return new AppError(message, 404, code);
    }

    static conflict(message, code = 'CONFLICT') {
        return new AppError(message, 409, code);
    }
}