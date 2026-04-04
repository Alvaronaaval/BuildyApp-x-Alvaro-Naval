import mongoose from 'mongoose';

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
    isFreelance: Boolean,
    deleted: { type: Boolean, default: false }
},
    {
        timestamps: true
    });

export default mongoose.model('Company', companySchema);