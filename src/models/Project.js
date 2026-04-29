import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDelete.js';

const projectSchema = new mongoose.Schema({
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
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200
    },
    projectCode: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        street: String,
        number: String,
        postal: String,
        city: String,
        province: String
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    notes: {
        type: String,
        maxlength: 2000
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    versionKey: false
});

projectSchema.index({ company: 1 });
projectSchema.index({ client: 1 });
projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });

projectSchema.plugin(softDeletePlugin);

export default mongoose.model('Project', projectSchema);
