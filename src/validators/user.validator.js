import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email().toLowerCase().trim(),
        password: z.string().min(8),
        name: z.string().min(2),
        lastName: z.string().min(2),
        nif: z.string().min(9)
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email().toLowerCase().trim(),
        password: z.string().min(8)
    })
});

export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string()
    })
});

export const validationSchema = z.object({
    body: z.object({
        code: z.string().length(6)
    })
});

// Bonus: Cambiar contraseña
export const passwordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8)
    }).refine(data => data.currentPassword !== data.newPassword, {
        message: 'La nueva contraseña debe ser diferente a la actual',
        path: ['newPassword']
    })
});

export const personalDataSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        lastName: z.string().min(2),
        nif: z.string().min(9)
    })
});

// Bonus: Onboarding de Compañía con Discriminated Union
export const companySchema = z.object({
    body: z.discriminatedUnion('isFreelance', [
        z.object({
            isFreelance: z.literal(true)
        }),
        z.object({
            isFreelance: z.literal(false),
            name: z.string().min(2),
            cif: z.string().min(8),
            address: z.object({
                street: z.string(),
                number: z.string(),
                postal: z.string(),
                city: z.string(),
                province: z.string()
            })
        })
    ])
});