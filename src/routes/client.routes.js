import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
    createClientSchema,
    updateClientSchema,
    clientIdSchema
} from '../validators/client.validator.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/client:
 *   post:
 *     tags:
 *       - Client
 *     summary: Crear un nuevo cliente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       201:
 *         description: Cliente creado
 *   get:
 *     tags:
 *       - Client
 *     summary: Listar clientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.post('/', validate(createClientSchema), clientController.createClient);
router.get('/', clientController.getClients);

router.get('/archived', clientController.getArchivedClients);

router.get('/:id', validate(clientIdSchema), clientController.getClient);
router.put('/:id', validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', validate(clientIdSchema), clientController.deleteClient);
router.patch('/:id/restore', validate(clientIdSchema), clientController.restoreClient);

export default router;
