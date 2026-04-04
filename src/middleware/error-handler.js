export const errorHandler = (err, req, res, next) => {
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            error: err.message
        });
    }

    console.error('Error no controlado:', err);

    res.status(500).json({
        error: 'Error interno del servidor'
    });
};  