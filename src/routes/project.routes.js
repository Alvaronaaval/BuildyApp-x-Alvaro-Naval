import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
    createProjectSchema,
    updateProjectSchema,
    projectIdSchema
} from '../validators/project.validator.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/project:
 *   post:
 *     tags:
 *       - Project
 *     summary: Crear un nuevo proyecto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       201:
 *         description: Proyecto creado
 *   get:
 *     tags:
 *       - Project
 *     summary: Listar proyectos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos
 */
router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getProjects);

router.get('/archived', projectController.getArchivedProjects);

router.get('/:id', validate(projectIdSchema), projectController.getProject);
router.put('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', validate(projectIdSchema), projectController.deleteProject);
router.patch('/:id/restore', validate(projectIdSchema), projectController.restoreProject);

export default router;
