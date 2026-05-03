import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const createClient = catchAsync(async (req, res) => {
    const { name, cif, email, phone, address } = req.body;

    if (!req.user.company) {
        throw AppError.badRequest('Debes tener una compañía para crear clientes');
    }

    const existingClient = await Client.findOne({
        cif,
        company: req.user.company
    });

    if (existingClient) {
        throw AppError.conflict('Ya existe un cliente con ese CIF en tu compañía');
    }

    const client = await Client.create({
        user: req.user._id,
        company: req.user.company,
        name,
        cif,
        email,
        phone,
        address
    });

    const io = req.app.get('io');
    io.to(`company:${req.user.company}`).emit('client:new', { data: client });

    res.status(201).json({ data: client });
});

export const getClients = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { company: req.user.company };

    if (req.query.name) {
        filter.name = { $regex: req.query.name, $options: 'i' };
    }

    const sort = req.query.sort || '-createdAt';

    const [clients, totalItems] = await Promise.all([
        Client.find(filter)
            .skip(skip)
            .limit(limit)
            .sort(sort),
        Client.countDocuments(filter)
    ]);

    res.json({
        data: clients,
        pagination: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            limit
        }
    });
});

export const getClient = catchAsync(async (req, res) => {
    const client = await Client.findOne({
        _id: req.params.id,
        company: req.user.company
    });

    if (!client) {
        throw AppError.notFound('Cliente no encontrado');
    }

    res.json({ data: client });
});

export const updateClient = catchAsync(async (req, res) => {
    if (req.body.cif) {
        const existingClient = await Client.findOne({
            cif: req.body.cif,
            company: req.user.company,
            _id: { $ne: req.params.id }
        });

        if (existingClient) {
            throw AppError.conflict('Ya existe otro cliente con ese CIF en tu compañía');
        }
    }

    const client = await Client.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company },
        req.body,
        { new: true, runValidators: true }
    );

    if (!client) {
        throw AppError.notFound('Cliente no encontrado');
    }

    res.json({ data: client });
});

export const deleteClient = catchAsync(async (req, res) => {
    const isSoft = req.query.soft === 'true';

    const client = await Client.findOne({
        _id: req.params.id,
        company: req.user.company
    });

    if (!client) {
        throw AppError.notFound('Cliente no encontrado');
    }

    if (isSoft) {
        await client.softDelete();
        res.json({ message: 'Cliente archivado correctamente' });
    } else {
        await Client.findByIdAndDelete(client._id);
        res.status(204).send();
    }
});

export const getArchivedClients = catchAsync(async (req, res) => {
    const clients = await Client.find({
        company: req.user.company,
        deleted: true
    }).setOptions({ withDeleted: true })
      .sort({ deletedAt: -1 });

    res.json({ data: clients });
});

export const restoreClient = catchAsync(async (req, res) => {
    const client = await Client.findOne({
        _id: req.params.id,
        company: req.user.company,
        deleted: true
    }).setOptions({ withDeleted: true });

    if (!client) {
        throw AppError.notFound('Cliente archivado no encontrado');
    }

    await client.restore();

    res.json({ message: 'Cliente restaurado correctamente', data: client });
});
