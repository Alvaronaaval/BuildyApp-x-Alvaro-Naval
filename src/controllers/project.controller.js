import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const createProject = catchAsync(async (req, res) => {
    const { name, projectCode, client, address, email, notes } = req.body;

    if (!req.user.company) {
        throw AppError.badRequest('Debes tener una compañía para crear proyectos');
    }

    const existingClient = await Client.findOne({
        _id: client,
        company: req.user.company
    });

    if (!existingClient) {
        throw AppError.notFound('Cliente no encontrado en tu compañía');
    }

    const existingProject = await Project.findOne({
        projectCode,
        company: req.user.company
    });

    if (existingProject) {
        throw AppError.conflict('Ya existe un proyecto con ese código en tu compañía');
    }

    const project = await Project.create({
        user: req.user._id,
        company: req.user.company,
        client,
        name,
        projectCode,
        address,
        email,
        notes
    });

    const io = req.app.get('io');
    io.to(`company:${req.user.company}`).emit('project:new', { data: project });

    res.status(201).json({ data: project });
});

export const getProjects = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { company: req.user.company };

    if (req.query.client) {
        filter.client = req.query.client;
    }

    if (req.query.name) {
        filter.name = { $regex: req.query.name, $options: 'i' };
    }

    if (req.query.active !== undefined) {
        filter.active = req.query.active === 'true';
    }

    const sort = req.query.sort || '-createdAt';

    const [projects, totalItems] = await Promise.all([
        Project.find(filter)
            .populate('client', 'name cif')
            .skip(skip)
            .limit(limit)
            .sort(sort),
        Project.countDocuments(filter)
    ]);

    res.json({
        data: projects,
        pagination: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    });
});

export const getProject = catchAsync(async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.id,
        company: req.user.company
    }).populate('client', 'name cif email phone address');

    if (!project) {
        throw AppError.notFound('Proyecto no encontrado');
    }

    res.json({ data: project });
});

export const updateProject = catchAsync(async (req, res) => {
    if (req.body.client) {
        const existingClient = await Client.findOne({
            _id: req.body.client,
            company: req.user.company
        });

        if (!existingClient) {
            throw AppError.notFound('Cliente no encontrado en tu compañía');
        }
    }

    if (req.body.projectCode) {
        const existingProject = await Project.findOne({
            projectCode: req.body.projectCode,
            company: req.user.company,
            _id: { $ne: req.params.id }
        });

        if (existingProject) {
            throw AppError.conflict('Ya existe otro proyecto con ese código en tu compañía');
        }
    }

    const project = await Project.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company },
        req.body,
        { new: true, runValidators: true }
    );

    if (!project) {
        throw AppError.notFound('Proyecto no encontrado');
    }

    res.json({ data: project });
});

export const deleteProject = catchAsync(async (req, res) => {
    const isSoft = req.query.soft === 'true';

    const project = await Project.findOne({
        _id: req.params.id,
        company: req.user.company
    });

    if (!project) {
        throw AppError.notFound('Proyecto no encontrado');
    }

    if (isSoft) {
        await project.softDelete();
        res.json({ message: 'Proyecto archivado correctamente' });
    } else {
        await Project.findByIdAndDelete(project._id);
        res.status(204).send();
    }
});

export const getArchivedProjects = catchAsync(async (req, res) => {
    const projects = await Project.find({
        company: req.user.company,
        deleted: true
    }).setOptions({ withDeleted: true })
      .populate('client', 'name cif')
      .sort({ deletedAt: -1 });

    res.json({ data: projects });
});

export const restoreProject = catchAsync(async (req, res) => {
    const project = await Project.findOne({
        _id: req.params.id,
        company: req.user.company,
        deleted: true
    }).setOptions({ withDeleted: true });

    if (!project) {
        throw AppError.notFound('Proyecto archivado no encontrado');
    }

    await project.restore();

    res.json({ message: 'Proyecto restaurado correctamente', data: project });
});
