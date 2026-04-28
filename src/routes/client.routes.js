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

router.post('/', validate(createClientSchema), clientController.createClient);
router.get('/', clientController.getClients);

router.get('/archived', clientController.getArchivedClients);

router.get('/:id', validate(clientIdSchema), clientController.getClient);
router.put('/:id', validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', validate(clientIdSchema), clientController.deleteClient);
router.patch('/:id/restore', validate(clientIdSchema), clientController.restoreClient);

export default router;
