
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    lastName: String,
    nif: String,
    role: { type: String, enum: ['admin', 'guest'], default: 'admin' },
    status: { type: String, enum: ['pending', 'verified'], default: 'pending' },
    verificationCode: String,
    verificationAttempts: { type: Number, default: 3 },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    address: {
        street: String,
        number: String,
        postal: String,
        city: String,
        province: String
    },
    deleted: { type: Boolean, default: false }
},
    {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true }
    });


userSchema.virtual('fullName').get(function () {
    return `${this.name} ${this.lastName}`;
});

// INDEXES
userSchema.index({ company: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

export default mongoose.model('User', userSchema);