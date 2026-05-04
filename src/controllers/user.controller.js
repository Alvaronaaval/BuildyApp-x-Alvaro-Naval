import User from '../models/User.js';
import Company from '../models/Company.js';
import RefreshToken from '../models/RefreshToken.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/handleJwt.js';
import { notificationService } from '../services/notification.service.js';
import mailService from '../services/mail.service.js';
import imageService from '../services/image.service.js';
import cloudinaryService from '../services/storage.service.js';

export const register = catchAsync(async (req, res) => {
    const { email, password, name, lastName, nif } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw AppError.conflict('El email ya está registrado');
    }

    const hashedPassword = await encrypt(password);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = await User.create({
        email,
        password: hashedPassword,
        name,
        lastName,
        nif,
        verificationCode,
        role: 'admin',
        status: 'pending',
        verificationAttempts: 3
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken();

    await RefreshToken.create({
        token: refreshToken,
        user: newUser._id,
        expiresAt: getRefreshTokenExpiry()
    });

    notificationService.emit('user:registered', newUser.email);
    mailService.sendVerificationCode(newUser.email, verificationCode);

    res.status(201).json({
        mensaje: 'Usuario registrado exitosamente',
        datos: {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status
        },
        accessToken,
        refreshToken
    });
});

export const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw new AppError('Credenciales inválidas', 401);
    }

    const checkPassword = await compare(password, user.password);
    if (!checkPassword) {
        throw new AppError('Credenciales inválidas', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt: getRefreshTokenExpiry()
    });

    user.password = undefined;

    res.json({
        datos: user,
        accessToken,
        refreshToken
    });
});

export const refresh = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    const storedToken = await RefreshToken.findOne({ token: refreshToken }).populate('user');

    if (!storedToken || !storedToken.isActive()) {
        throw new AppError('Refresh token inválido o expirado', 401);
    }

    storedToken.revokedAt = new Date();
    await storedToken.save();

    const newAccessToken = generateAccessToken(storedToken.user);
    const newRefreshToken = generateRefreshToken();

    await RefreshToken.create({
        token: newRefreshToken,
        user: storedToken.user._id,
        expiresAt: getRefreshTokenExpiry()
    });

    res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    });
});

export const logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        await RefreshToken.findOneAndUpdate(
            { token: refreshToken },
            { revokedAt: new Date() }
        );
    }

    res.json({ mensaje: 'Sesión cerrada correctamente' });
});

export const getUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id).populate('company');

    if (!user) {
        throw AppError.notFound('Usuario');
    }

    res.json({ data: user });
});

export const uploadLogo = catchAsync(async (req, res) => {
    if (!req.file) {
        throw AppError.badRequest('No se subió ninguna imagen');
    }

    if (!req.user.company) {
        throw AppError.badRequest('El usuario no tiene una compañía asociada');
    }

    // 1. Optimizar imagen: resize ≤800px + convertir a WebP
    const optimized = await imageService.optimize(req.file.buffer, {
        format: 'webp',
        quality: 80,
        maxWidth: 800,
    });

    // 2. Subir a Cloudinary y obtener la URL pública
    const result = await cloudinaryService.uploadImage(optimized, {
        folder: 'bildyapp/logos',
    });

    // 3. Guardar la URL en el modelo Company
    const updatedCompany = await Company.findByIdAndUpdate(
        req.user.company,
        { logo: result.secure_url },
        { new: true }
    );

    if (!updatedCompany) {
        throw AppError.notFound('Compañía');
    }

    res.json({
        mensaje: 'Logo actualizado correctamente',
        data: {
            logoUrl: result.secure_url,
            company: updatedCompany,
        },
    });
});

export const verifyEmail = catchAsync(async (req, res) => {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (user.status === 'verified') {
        throw AppError.badRequest('El usuario ya está verificado');
    }

    if (user.verificationAttempts <= 0) {
        throw new AppError('Se han agotado los intentos de verificación', 429);
    }

    if (user.verificationCode !== code) {
        user.verificationAttempts -= 1;
        await user.save();
        throw AppError.badRequest(`Código incorrecto. Te quedan ${user.verificationAttempts} intentos`);
    }

    user.status = 'verified';
    user.verificationCode = undefined;
    await user.save();

    notificationService.emit('user:verified', user.email);

    res.json({ mensaje: 'Email verificado correctamente', datos: user });
});

export const updatePersonalData = catchAsync(async (req, res) => {
    const { name, lastName, nif } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, lastName, nif },
        { new: true }
    );

    res.json({ mensaje: 'Datos personales actualizados', datos: user });
});

export const onboardingCompany = catchAsync(async (req, res) => {
    const { isFreelance, name, cif, address } = req.body;
    const user = await User.findById(req.user._id);

    let companyCif = cif;
    let companyName = name;
    let companyAddress = address;

    if (isFreelance) {
        companyCif = user.nif;
        companyName = user.fullName;
        companyAddress = user.address;
    }

    let company = await Company.findOne({ cif: companyCif });

    if (company) {
        user.company = company._id;
        user.role = 'guest';
    } else {
        company = await Company.create({
            owner: user._id,
            name: companyName,
            cif: companyCif,
            address: companyAddress,
            isFreelance
        });
        user.company = company._id;
    }

    await user.save();

    res.json({ mensaje: 'Compañía configurada correctamente', datos: { user, company } });
});

export const deleteUser = catchAsync(async (req, res) => {
    const isSoft = req.query.soft === 'true';
    const user = await User.findById(req.user._id);

    if (isSoft) {
        await user.softDelete();
    } else {
        await User.findByIdAndDelete(req.user._id);
    }

    notificationService.emit('user:deleted', user.email);

    res.status(204).send();
});

export const changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const checkPassword = await compare(currentPassword, user.password);
    if (!checkPassword) {
        throw new AppError('La contraseña actual es incorrecta', 401);
    }

    user.password = await encrypt(newPassword);
    await user.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
});

export const inviteUser = catchAsync(async (req, res) => {
    const { email, password, name, lastName, nif } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw AppError.conflict('El email ya está registrado');
    }

    const hashedPassword = await encrypt(password);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = await User.create({
        email,
        password: hashedPassword,
        name,
        lastName,
        nif,
        role: 'guest',
        company: req.user.company,
        status: 'pending',
        verificationCode,
        verificationAttempts: 3
    });

    notificationService.emit('user:invited', email, req.user.email);

    res.status(201).json({
        mensaje: 'Usuario invitado exitosamente',
        datos: newUser
    });
});