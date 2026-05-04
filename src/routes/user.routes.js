import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';
import { upload as uploadImage } from '../config/multer.js';
import {
    registerSchema,
    loginSchema,
    refreshSchema,
    validationSchema,
    personalDataSchema,
    companySchema,
    passwordSchema
} from '../validators/user.validator.js';

const router = Router();

/**
 * @openapi
 * /api/user/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Registrar un nuevo administrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, lastName, nif]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               name: { type: string }
 *               lastName: { type: string }
 *               nif: { type: string }
 *     responses:
 *       201:
 *         description: Creado
 *       400:
 *         description: Validación fallida
 */
router.post('/register', validate(registerSchema), userController.register);

/**
 * @openapi
 * /api/user/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', validate(loginSchema), userController.login);
router.post('/refresh', validate(refreshSchema), userController.refresh);

/**
 * @openapi
 * /api/user:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Obtener perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de usuario
 */
router.get('/', authMiddleware, userController.getUser);
router.post('/logout', authMiddleware, userController.logout);
router.patch('/logo', authMiddleware, uploadImage.single('logo'), userController.uploadLogo);
router.delete('/', authMiddleware, userController.deleteUser);
router.put('/validation', authMiddleware, validate(validationSchema), userController.verifyEmail);
router.put('/register', authMiddleware, validate(personalDataSchema), userController.updatePersonalData);
router.patch('/company', authMiddleware, validate(companySchema), userController.onboardingCompany);
router.put('/password', authMiddleware, validate(passwordSchema), userController.changePassword);
router.post('/invite', authMiddleware, roleMiddleware(['admin']), validate(registerSchema), userController.inviteUser);

export default router;