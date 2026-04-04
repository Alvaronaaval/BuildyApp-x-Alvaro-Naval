import User from '../models/User.js';
import Company from '../models/Company.js';

export const register = async (req, res) => {
    try {
        const { email, password, name, lastName, nif } = req.body;

        // 1. Comprobar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        // 2. Generar código de validación de 6 dígitos aleatorio
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Crear el usuario en MongoDB
        const newUser = await User.create({
            email,
            password,
            name,
            lastName,
            nif,
            verificationCode,
            role: 'admin',
            status: 'pending',
            verificationAttempts: 3
        });

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            datos: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
export const getUser = async (req, res) => {
    try {

        const mockUserId = "693344558a765785601e8596";

        // Usamos populate para traer los datos de la compañía en vez de solo el ID
        const user = await User.findById(mockUserId)
            .populate('company');

        if (!user) {
            // TEMA 6 AVISO: Esto se cambiará por throw AppError.notFound()
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ data: user });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// PATCH /api/user/logo - Subir logo de compañía
export const uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const mockCompanyId = "693344558a765785601e8596";

        const logoUrl = `/uploads/${req.file.filename}`;

        const updatedCompany = await Company.findByIdAndUpdate(
            mockCompanyId,
            { logo: logoUrl },
            { new: true }
        );

        if (!updatedCompany) {
            return res.status(404).json({ error: 'Compañía no encontrada' });
        }

        res.json({
            mensaje: 'Logo actualizado correctamente',
            data: updatedCompany
        });

    } catch (error) {
        console.error('Error al subir logo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};