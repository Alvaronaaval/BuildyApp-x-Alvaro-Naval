import { z } from 'zod';

const addressSchema = z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    postal: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1)
});

export const createClientSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        cif: z.string().min(8),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: addressSchema
    })
});

export const updateClientSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido')
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        cif: z.string().min(8).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: addressSchema.partial().optional()
    }).refine(
        (data) => Object.keys(data).length > 0,
        { message: 'Debe enviar al menos un campo para actualizar' }
    )
});

export const clientIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID no válido')
    })
});
