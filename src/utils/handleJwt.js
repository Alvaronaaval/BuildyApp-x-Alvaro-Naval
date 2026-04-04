import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

export const generateAccessToken = (user) => {
    return jwt.sign(
        { _id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

export const getRefreshTokenExpiry = () => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
};