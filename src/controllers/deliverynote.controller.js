import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

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

export const deleteDeliveryNote = catchAsync(async (req, res) => {
    const deliveryNote = await DeliveryNote.findOne({
        _id: req.params.id,
        company: req.user.company
    });

    if (!deliveryNote) {
        throw AppError.notFound('Albarán no encontrado');
    }

    if (deliveryNote.signed) {
        throw AppError.badRequest('No se puede eliminar un albarán firmado');
    }

    await DeliveryNote.findByIdAndDelete(deliveryNote._id);
    res.status(204).send();
});
