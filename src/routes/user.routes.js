import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';
import { uploadImage } from '../config/multer.js';
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

router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);
router.post('/refresh', validate(refreshSchema), userController.refresh);

router.post('/logout', authMiddleware, userController.logout);
router.get('/', authMiddleware, userController.getUser);
router.patch('/logo', authMiddleware, uploadImage.single('logo'), userController.uploadLogo);
router.delete('/', authMiddleware, userController.deleteUser);

router.put('/validation', authMiddleware, validate(validationSchema), userController.verifyEmail);
router.put('/register', authMiddleware, validate(personalDataSchema), userController.updatePersonalData);
router.patch('/company', authMiddleware, validate(companySchema), userController.onboardingCompany);
router.put('/password', authMiddleware, validate(passwordSchema), userController.changePassword);

router.post('/invite', authMiddleware, roleMiddleware(['admin']), validate(registerSchema), userController.inviteUser);

export default router;