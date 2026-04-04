export const sanitizeBody = (req, res, next) => {
    if (req.body) {
        const sanitize = (obj) => {
            for (const key in obj) {
                if (key.startsWith('$')) {
                    delete obj[key];
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitize(obj[key]);
                }
            }
        };
        sanitize(req.body);
    }
    next();
};