import mongoose from 'mongoose';
import { softDeletePlugin } from '../utils/softDelete.js';

const companySchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    cif: String,
    address: {
        street: String,
        number: String,
        postal: String,
        city: String,
        province: String
    },
    logo: String,
    isFreelance: Boolean
}, {
    timestamps: true,
    versionKey: false
});

companySchema.plugin(softDeletePlugin);

export default mongoose.model('Company', companySchema);