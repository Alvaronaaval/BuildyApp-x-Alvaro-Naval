import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: Date
}, {
    timestamps: true,
    versionKey: false
});

refreshTokenSchema.methods.isActive = function () {
    return !this.revokedAt && this.expiresAt > new Date();
};

export default mongoose.model('RefreshToken', refreshTokenSchema);