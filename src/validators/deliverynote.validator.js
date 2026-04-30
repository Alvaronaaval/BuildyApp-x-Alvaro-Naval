import { z } from 'zod';

const workerSchema = z.object({
    name: z.string().min(1),
    hours: z.number().positive()
});

export const createDeliveryNoteSchema = z.object({
    body: z.object({
        project: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de proyecto no válido'),
        format: z.enum(['material', 'hours']),
        description: z.string().optional(),
        workDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha no válida'),
        material: z.string().optional(),
        quantity: z.number().positive().optional(),
        unit: z.string().optional(),
        hours: z.number().positive().optional(),
        workers: z.array(workerSchema).optional()
    }).refine(
        (data) => {
            if (data.format === 'material') {
                return data.material && data.quantity && data.unit;
            }
            return true;
        },
        { message: 'Los albaranes de material requieren material, quantity y unit', path: ['material'] }
    ).refine(
        (data) => {
            if (data.format === 'hours') {
                return data.hours || (data.workers && data.workers.length > 0);
            }
            return true;
        },
        { message: 'Los albaranes de horas requieren hours o workers', path: ['hours'] }
    )
});

export const deliveryNoteIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido')
    })
});
