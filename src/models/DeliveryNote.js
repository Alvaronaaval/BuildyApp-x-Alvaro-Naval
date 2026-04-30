import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDelete.js';

const deliveryNoteSchema = new mongoose.Schema({
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
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    format: {
        type: String,
        enum: ['material', 'hours'],
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    workDate: {
        type: Date,
        required: true
    },
    material: String,
    quantity: Number,
    unit: String,
    hours: Number,
    workers: [{
        name: String,
        hours: Number
    }],
    signed: {
        type: Boolean,
        default: false
    },
    signedAt: Date,
    signatureUrl: String,
    pdfUrl: String
}, {
    timestamps: true,
    versionKey: false
});

deliveryNoteSchema.index({ company: 1 });
deliveryNoteSchema.index({ project: 1 });
deliveryNoteSchema.index({ client: 1 });
deliveryNoteSchema.index({ workDate: -1 });

deliveryNoteSchema.plugin(softDeletePlugin);

export default mongoose.model('DeliveryNote', deliveryNoteSchema);
