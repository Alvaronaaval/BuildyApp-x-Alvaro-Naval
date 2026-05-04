import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'API BildyApp',
            version: '1.0.0',
            description: 'Documentación interactiva de la API BildyApp',
            contact: {
                name: 'Alvaro Gabriel Naval Rodriguez'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de desarrollo local'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109ca' },
                        email: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
                        name: { type: 'string', example: 'Juan' },
                        lastName: { type: 'string', example: 'Pérez' },
                        nif: { type: 'string', example: '12345678A' },
                        role: { type: 'string', enum: ['admin', 'guest'] },
                        status: { type: 'string', enum: ['pending', 'verified'] },
                        company: { type: 'string', description: 'Company ID' }
                    }
                },
                Company: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cb' },
                        name: { type: 'string', example: 'Empresa S.A.' },
                        cif: { type: 'string', example: 'B12345678' },
                        logoUrl: { type: 'string', format: 'uri' }
                    }
                },
                Client: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cc' },
                        name: { type: 'string', example: 'Cliente Importante' },
                        cif: { type: 'string', example: 'A87654321' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' }
                    }
                },
                Project: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109cd' },
                        name: { type: 'string', example: 'Reforma Local Centro' },
                        projectCode: { type: 'string', example: 'PRJ-2026-001' },
                        client: { type: 'string', description: 'Client ID' },
                        active: { type: 'boolean', default: true }
                    }
                },
                DeliveryNote: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f5311236168a109ce' },
                        clientId: { type: 'string' },
                        projectId: { type: 'string' },
                        format: { type: 'string', enum: ['material', 'hours'] },
                        description: { type: 'string' },
                        workDate: { type: 'string', format: 'date' },
                        status: { type: 'string', enum: ['pending', 'signed'] },
                        pdfUrl: { type: 'string', format: 'uri' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Mensaje de error' },
                        code: { type: 'string', example: 'ERROR_CODE' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);
