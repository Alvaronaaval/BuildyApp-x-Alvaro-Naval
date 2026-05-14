import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import imageService from '../services/image.service.js';
import cloudinaryService from '../services/storage.service.js';
import pdfService from '../services/pdf.service.js';

export const createDeliveryNote = catchAsync(async (req, res) => {
    const { project, format, description, workDate, material, quantity, unit, hours, workers } = req.body;

    if (!req.user.company) {
        throw AppError.badRequest('Debes tener una compañía para crear albaranes');
    }

    const existingProject = await Project.findOne({
        _id: project,
        company: req.user.company
    });

    if (!existingProject) {
        throw AppError.notFound('Proyecto no encontrado en tu compañía');
    }

    const deliveryNote = await DeliveryNote.create({
        user: req.user._id,
        company: req.user.company,
        client: existingProject.client,
        project,
        format,
        description,
        workDate,
        material,
        quantity,
        unit,
        hours,
        workers
    });

    const io = req.app.get('io');
    io.to(`company:${req.user.company}`).emit('deliverynote:new', { data: deliveryNote });

    res.status(201).json({ data: deliveryNote });
});

export const getDeliveryNotes = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { company: req.user.company };

    if (req.query.project) filter.project = req.query.project;
    if (req.query.client) filter.client = req.query.client;
    if (req.query.format) filter.format = req.query.format;
    if (req.query.signed !== undefined) filter.signed = req.query.signed === 'true';

    if (req.query.from || req.query.to) {
        filter.workDate = {};
        if (req.query.from) filter.workDate.$gte = new Date(req.query.from);
        if (req.query.to) filter.workDate.$lte = new Date(req.query.to);
    }

    const sort = req.query.sort || '-workDate';

    const [deliveryNotes, totalItems] = await Promise.all([
        DeliveryNote.find(filter)
            .populate('client', 'name cif')
            .populate('project', 'name projectCode')
            .skip(skip)
            .limit(limit)
            .sort(sort),
        DeliveryNote.countDocuments(filter)
    ]);

    res.json({
        data: deliveryNotes,
        pagination: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    });
});

export const getDeliveryNote = catchAsync(async (req, res) => {
    const deliveryNote = await DeliveryNote.findOne({
        _id: req.params.id,
        company: req.user.company
    })
        .populate('user', 'name lastName email')
        .populate('client', 'name cif email phone address')
        .populate('project', 'name projectCode address');

    if (!deliveryNote) {
        throw AppError.notFound('Albarán no encontrado');
    }

    res.json({ data: deliveryNote });
});

export const downloadPdf = catchAsync(async (req, res) => {
    const deliveryNote = await DeliveryNote.findOne({
        _id: req.params.id,
        company: req.user.company
    })
        .populate('user', 'name lastName email')
        .populate('client', 'name cif email phone address')
        .populate('project', 'name projectCode address');

    if (!deliveryNote) {
        throw AppError.notFound('Albarán no encontrado');
    }

    if (deliveryNote.signed && deliveryNote.pdfUrl) {
        const response = await fetch(deliveryNote.pdfUrl);
        const pdfBuffer = Buffer.from(await response.arrayBuffer());

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="albaran.pdf"');
        return res.send(pdfBuffer);
    }

    pdfService.streamDeliveryNotePdf(deliveryNote, res);
});

export const signDeliveryNote = catchAsync(async (req, res) => {
    if (!req.file) {
        throw AppError.badRequest('No se envió la imagen de firma');
    }

    const deliveryNote = await DeliveryNote.findOne({
        _id: req.params.id,
        company: req.user.company
    });

    if (!deliveryNote) {
        throw AppError.notFound('Albarán no encontrado');
    }

    if (deliveryNote.signed) {
        throw AppError.conflict('Este albarán ya está firmado y no puede volver a firmarse');
    }

    const optimized = await imageService.optimize(req.file.buffer, {
        format: 'webp',
        quality: 80,
        maxWidth: 800,
    });

    const signatureResult = await cloudinaryService.uploadImage(optimized, {
        folder: 'bildyapp/signatures',
    });

    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();
    deliveryNote.signatureUrl = signatureResult.secure_url;
    await deliveryNote.save();

    const populatedNote = await DeliveryNote.findById(deliveryNote._id)
        .populate('user', 'name lastName email')
        .populate('client', 'name cif email phone address')
        .populate('project', 'name projectCode address');

    const pdfBuffer = await pdfService.generateDeliveryNotePdf(populatedNote);

    const pdfResult = await cloudinaryService.uploadPdf(pdfBuffer, {
        folder: 'bildyapp/pdfs',
    });

    deliveryNote.pdfUrl = pdfResult.secure_url;
    await deliveryNote.save();

    const io = req.app.get('io');
    io.to(`company:${req.user.company}`).emit('deliverynote:signed', {
        data: { _id: deliveryNote._id, signedAt: deliveryNote.signedAt }
    });

    res.json({
        message: 'Albarán firmado correctamente',
        data: {
            signatureUrl: deliveryNote.signatureUrl,
            pdfUrl: deliveryNote.pdfUrl,
            signedAt: deliveryNote.signedAt
        }
    });
});

export const deleteDeliveryNote = catchAsync(async (req, res) => {
    const deliveryNote = await DeliveryNote.findOne({
        _id: req.params.id,
        company: req.user.company
    });

    if (!deliveryNote) {
        throw AppError.notFound('Albarán no encontrado');
    }

    if (deliveryNote.signed) {
        throw AppError.conflict('No se puede eliminar un albarán firmado — es un documento con validez legal');
    }

    await DeliveryNote.findByIdAndDelete(deliveryNote._id);
    res.status(204).send();
});
