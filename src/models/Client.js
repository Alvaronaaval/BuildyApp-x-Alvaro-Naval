import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDelete.js';

const clientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    cif: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        number: String,
        postal: String,
        city: String,
        province: String
    }
}, {
    timestamps: true,
    versionKey: false
});

clientSchema.index({ company: 1 });
clientSchema.index({ company: 1, cif: 1 }, { unique: true });

clientSchema.plugin(softDeletePlugin);

export default mongoose.model('Client', clientSchema);
