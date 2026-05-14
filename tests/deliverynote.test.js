/**
 * tests/deliverynote.test.js
 *
 * Tests de integración para el contrato HTTP de albaranes.
 * Documentan el comportamiento esperado del API como "living documentation".
 *
 * Estrategia:
 *  - mongodb-memory-server: BD real en memoria, sin MongoDB externo.
 *  - jest.unstable_mockModule(): mockea ESM correctamente (no se puede usar
 *    jest.mock() con imports estáticos en ESM puro).
 *  - supertest: hace peticiones HTTP reales a la app Express.
 *  - Se crean usuarios/proyectos reales en la BD para tests completos.
 */

import { jest } from '@jest/globals';

// ─── 1. MOCKS DE SERVICIOS EXTERNOS ──────────────────────────────────────────
// Con ESM nativo hay que usar jest.unstable_mockModule() ANTES de los imports
// dinámicos. Estos mocks evitan llamadas reales a Cloudinary, Sharp y Slack.

// Mock de image.service.js (Sharp): devuelve el buffer tal cual, sin procesar.
await jest.unstable_mockModule('../src/services/image.service.js', () => ({
    default: {
        optimize: jest.fn(async (buffer) => buffer),
    },
}));

// Mock de storage.service.js (Cloudinary): simula una subida exitosa.
await jest.unstable_mockModule('../src/services/storage.service.js', () => ({
    default: {
        uploadImage: jest.fn(async () => ({
            secure_url: 'https://res.cloudinary.com/fake/signature.webp',
            public_id: 'fake_sig_id',
        })),
        uploadPdf: jest.fn(async () => ({
            secure_url: 'https://res.cloudinary.com/fake/albaran.pdf',
            public_id: 'fake_pdf_id',
        })),
    },
}));

// Mock de pdf.service.js (PDFKit): devuelve un buffer vacío.
await jest.unstable_mockModule('../src/services/pdf.service.js', () => ({
    default: {
        generateDeliveryNotePdf: jest.fn(async () => Buffer.from('fake-pdf')),
        streamDeliveryNotePdf: jest.fn((note, res) => res.end()),
    },
}));

// Mock de logger.service.js (@slack/webhook): evita llamadas reales a Slack.
await jest.unstable_mockModule('../src/services/logger.service.js', () => ({
    default: {
        logError: jest.fn(),
        logInfo: jest.fn(),
    },
}));

// ─── 2. IMPORTS DINÁMICOS (después de registrar los mocks) ───────────────────
// Con ESM debemos importar DESPUÉS de mockear para que Jest intercepte los módulos.

const { MongoMemoryServer } = await import('mongodb-memory-server');
const mongoose = (await import('mongoose')).default;
const supertest = (await import('supertest')).default;
const jwt = (await import('jsonwebtoken')).default;
const app = (await import('../src/app.js')).default;
const User = (await import('../src/models/User.js')).default;
const Client = (await import('../src/models/Client.js')).default;
const Project = (await import('../src/models/Project.js')).default;
const DeliveryNote = (await import('../src/models/DeliveryNote.js')).default;

// ─── 3. CONSTANTE DE TEST ────────────────────────────────────────────────────
// Secreto local para firmar JWTs — no necesita coincidir con .env de producción.
const JWT_SECRET = 'test-secret-para-examen';

/**
 * Crea un token JWT firmado con el mismo secreto que usará authMiddleware.
 * El payload sólo lleva _id porque authMiddleware hace User.findById(_id).
 */
const makeToken = (userId) =>
    jwt.sign({ _id: userId.toString() }, JWT_SECRET, { expiresIn: '1h' });

// ─── 4. SETUP / TEARDOWN ─────────────────────────────────────────────────────
let mongod;

beforeAll(async () => {
    // 1. Arranca MongoDB en memoria
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // 2. Configura env vars para el módulo de JWT
    process.env.JWT_SECRET = JWT_SECRET;

    // 3. Conecta Mongoose a la instancia en memoria
    await mongoose.connect(uri);

    // 4. La app Express usa req.app.get('io') para emitir eventos de Socket.IO.
    //    En tests no hay servidor WS real, así que mockeamos el objeto io.
    app.set('io', {
        to: () => ({ emit: () => {} }),
    });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

// Limpia colecciones entre tests para evitar contaminación de estado.
beforeEach(async () => {
    await User.deleteMany({});
    await Client.deleteMany({});
    await Project.deleteMany({});
    await DeliveryNote.deleteMany({});
});

// ─── 5. HELPERS ──────────────────────────────────────────────────────────────

/**
 * Crea en BD los fixtures mínimos para un test de albarán:
 * usuario con compañía, cliente y proyecto.
 *
 * @param {string} suffix - sufijo para hacer email y projectCode únicos entre tests
 * @returns {{ user, client, project, companyId, token }}
 */
async function createFixtures(suffix) {
    const companyId = new mongoose.Types.ObjectId();

    const user = await User.create({
        email: `tester-${suffix}@bildyapp.test`,
        password: 'hashedpassword',
        name: 'Tester',
        lastName: 'BildyApp',
        role: 'admin',
        status: 'verified',
        company: companyId,
    });

    const client = await Client.create({
        user: user._id,
        company: companyId,
        name: 'Cliente Test',
        cif: `B${suffix.padStart(7, '0')}`,
    });

    const project = await Project.create({
        user: user._id,
        company: companyId,
        client: client._id,
        name: 'Proyecto Test',
        projectCode: `PRJ-${suffix}`,
    });

    return { user, client, project, companyId, token: makeToken(user._id) };
}

// ─── 6. TESTS ────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────
// TEST 1: Crear albarán exitoso → 201
// ──────────────────────────────────────────────────
describe('POST /api/deliverynote — Crear albarán', () => {
    it('devuelve 201 con los campos format, workDate y project', async () => {
        // DADO un usuario autenticado con proyecto válido en su compañía
        const { project, token } = await createFixtures('001');

        const body = {
            project: project._id.toString(),
            format: 'hours',
            workDate: '2026-06-01',
            hours: 8,
            description: 'Instalación eléctrica planta baja',
        };

        // CUANDO crea un albarán con datos válidos
        const res = await supertest(app)
            .post('/api/deliverynote')
            .set('Authorization', `Bearer ${token}`)
            .send(body);

        // ENTONCES el servidor responde 201 con los campos del albarán
        expect(res.status).toBe(201);
        expect(res.body.data.format).toBe('hours');
        expect(res.body.data.project).toBe(project._id.toString());
        expect(res.body.data.workDate).toBeDefined();
    });
});

// ──────────────────────────────────────────────────
// TEST 2: 409 al firmar un albarán ya firmado
// ──────────────────────────────────────────────────
describe('PATCH /api/deliverynote/:id/sign — Firmar albarán', () => {
    it('devuelve 409 Conflict al intentar firmar un albarán que ya está firmado', async () => {
        // DADO un albarán que ya tiene signed: true en BD
        const { user, project, client, companyId, token } = await createFixtures('002');

        const note = await DeliveryNote.create({
            user: user._id,
            company: companyId,
            client: client._id,
            project: project._id,
            format: 'material',
            workDate: new Date('2026-06-01'),
            signed: true,       // <── estado que hace imposible la operación
            signedAt: new Date(),
            signatureUrl: 'https://cloudinary.com/existing-signature.webp',
        });

        // CUANDO intentamos volver a firmarlo (petición formalmente correcta)
        const res = await supertest(app)
            .patch(`/api/deliverynote/${note._id}/sign`)
            .set('Authorization', `Bearer ${token}`)
            .attach('signature', Buffer.from('fake-image-data'), {
                filename: 'firma.png',
                contentType: 'image/png',
            });

        // ENTONCES el servidor rechaza con 409 (no 400)
        // porque el error es un CONFLICTO DE ESTADO, no una petición malformada.
        expect(res.status).toBe(409);
        expect(res.body.code).toBe('CONFLICT');
        expect(res.body.message).toMatch(/ya está firmado/i);
    });
});

// ──────────────────────────────────────────────────
// TEST 3: 409 al eliminar un albarán firmado
// ──────────────────────────────────────────────────
describe('DELETE /api/deliverynote/:id — Eliminar albarán', () => {
    it('devuelve 409 Conflict al intentar eliminar un albarán firmado', async () => {
        // DADO un albarán firmado — documento con validez legal
        const { user, project, client, companyId, token } = await createFixtures('003');

        const note = await DeliveryNote.create({
            user: user._id,
            company: companyId,
            client: client._id,
            project: project._id,
            format: 'hours',
            workDate: new Date('2026-06-01'),
            signed: true,       // <── estado que hace imposible la operación
            signedAt: new Date(),
            signatureUrl: 'https://cloudinary.com/existing-signature.webp',
        });

        // CUANDO intentamos eliminarlo (petición formalmente correcta)
        const res = await supertest(app)
            .delete(`/api/deliverynote/${note._id}`)
            .set('Authorization', `Bearer ${token}`);

        // ENTONCES el servidor rechaza con 409 (no 400)
        // RFC 9110 §15.5.10: "The server cannot complete the request because
        // it conflicts with the current state of the target resource."
        expect(res.status).toBe(409);
        expect(res.body.code).toBe('CONFLICT');
        expect(res.body.message).toMatch(/no se puede eliminar/i);
    });
});

// ──────────────────────────────────────────────────
// TEST 4: Aislamiento multi-tenant
// ──────────────────────────────────────────────────
describe('Multi-tenant — Aislamiento entre compañías', () => {
    it('usuario de compañía B recibe 404 al intentar acceder al albarán de compañía A', async () => {
        // DADO dos compañías independientes con sus propios usuarios y albaranes
        const fixturesA = await createFixtures('compA');
        const noteA = await DeliveryNote.create({
            user: fixturesA.user._id,
            company: fixturesA.companyId,
            client: fixturesA.client._id,
            project: fixturesA.project._id,
            format: 'hours',
            workDate: new Date('2026-06-15'),
            hours: 4,
        });

        const fixturesB = await createFixtures('compB');

        // CUANDO el usuario de B intenta leer el albarán de A por su id
        const res = await supertest(app)
            .get(`/api/deliverynote/${noteA._id}`)
            .set('Authorization', `Bearer ${fixturesB.token}`);

        // ENTONCES recibe 404 — el sistema no revela la existencia del recurso
        // (el controlador filtra siempre por { _id, company: req.user.company })
        expect(res.status).toBe(404);
    });
});
