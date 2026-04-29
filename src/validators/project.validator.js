import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    postal: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1)
});

export const createProjectSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(200),
        projectCode: z.string().min(1),
        client: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente no válido'),
        address: addressSchema,
        email: z.string().email().optional(),
        notes: z.string().max(2000).optional()
    })
});

export const updateProjectSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido')
    }),
    body: z.object({
        name: z.string().min(2).max(200).optional(),
        projectCode: z.string().min(1).optional(),
        client: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de cliente no válido').optional(),
        address: addressSchema.partial().optional(),
        email: z.string().email().optional(),
        notes: z.string().max(2000).optional(),
        active: z.boolean().optional()
    }).refine(
        (data) => Object.keys(data).length > 0,
        { message: 'Debe enviar al menos un campo para actualizar' }
    )
});

export const projectIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido')
    })
});
