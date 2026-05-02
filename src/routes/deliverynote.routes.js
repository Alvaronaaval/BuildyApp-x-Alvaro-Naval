import { Router } from 'express';
import * as deliveryNoteController from '../controllers/deliverynote.controller.js';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { upload } from '../config/multer.js';
import {
    createDeliveryNoteSchema,
    deliveryNoteIdSchema
} from '../validators/deliverynote.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createDeliveryNoteSchema), deliveryNoteController.createDeliveryNote);
router.get('/', deliveryNoteController.getDeliveryNotes);

router.get('/pdf/:id', validate(deliveryNoteIdSchema), deliveryNoteController.downloadPdf);

router.get('/:id', validate(deliveryNoteIdSchema), deliveryNoteController.getDeliveryNote);
router.patch('/:id/sign', upload.single('signature'), deliveryNoteController.signDeliveryNote);
router.delete('/:id', validate(deliveryNoteIdSchema), deliveryNoteController.deleteDeliveryNote);

export default router;
