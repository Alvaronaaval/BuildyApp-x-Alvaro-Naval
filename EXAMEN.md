# EXAMEN — Alvaro Naval

## Reto

F1 — Semántica HTTP 400→409 en operaciones de albarán firmado + tests que documentan el contrato

---

## Tarea técnica

### Qué problema detecté

En `src/controllers/deliverynote.controller.js` había dos errores de semántica HTTP:

- **Línea 142** (`signDeliveryNote`): `throw AppError.badRequest('Este albarán ya está firmado')` → devolvía **400**.
- **Línea 200** (`deleteDeliveryNote`): `throw AppError.badRequest('No se puede eliminar un albarán firmado')` → devolvía **400**.

El código 400 (Bad Request) implica que la petición en sí está malformada: JSON inválido, campos ausentes o datos de tipo incorrecto. Sin embargo, en ambos casos la petición era correcta: el JSON era válido, el `id` del albarán existía en la BD, y el usuario tenía permisos. El único problema era el **estado del recurso** (`signed: true`), que hacía imposible la operación. Eso no es un error del cliente al formular la petición — es un conflicto con el estado actual del servidor.

### Cómo lo arreglé

Cambié ambas llamadas de `AppError.badRequest(...)` a `AppError.conflict(...)` en `src/controllers/deliverynote.controller.js`:

```diff
// signDeliveryNote (línea 142)
-        throw AppError.badRequest('Este albarán ya está firmado');
+        throw AppError.conflict('Este albarán ya está firmado y no puede volver a firmarse');

// deleteDeliveryNote (línea 200)
-        throw AppError.badRequest('No se puede eliminar un albarán firmado');
+        throw AppError.conflict('No se puede eliminar un albarán firmado — es un documento con validez legal');
```

`AppError.conflict` ya estaba definido en `src/utils/AppError.js:21` y devuelve `statusCode: 409, code: 'CONFLICT'`. No necesité crear nada nuevo — simplemente usé el método correcto que ya existía.

### Por qué mi solución es correcta

El RFC 9110 (HTTP Semantics), §15.5.10, define el 409 así: *"The server cannot complete the request because it conflicts with the current state of the target resource."* Es exactamente lo que ocurre: el albarán existe, el usuario tiene permisos, la petición es válida — pero el estado `signed: true` hace la operación imposible. El mismo patrón se usa en `createClient` (cuando el CIF ya existe) y `createProject` (cuando el código ya existe), que correctamente usan `AppError.conflict`. La corrección hace que el comportamiento del controlador sea coherente con el resto de la API.

---

## Respuestas socráticas

### 1. ¿Por qué 409 Conflict y no 400 Bad Request para el albarán ya firmado?

El código **400 Bad Request** describe un error en la **petición en sí misma**: el JSON está malformado, falta un campo requerido, o un valor tiene el tipo incorrecto. El servidor no puede entender o procesar la petición porque el cliente la formuló mal. El código **409 Conflict** describe que la petición es perfectamente válida y comprensible, pero el **estado actual del recurso** la hace imposible de completar. En el caso del albarán firmado, el cliente envía un id válido, tiene autenticación correcta y el formato multipart está bien — el problema es que `note.signed === true` en la BD. La diferencia es fundamental: 400 implica "arregla tu petición", 409 implica "la petición es correcta, pero el servidor está en un estado que lo impide". El mismo patrón lo aplica correctamente `createClient` cuando devuelve 409 al encontrar un CIF duplicado: la petición de crear un cliente es formalmente válida, pero el estado actual de la BD lo impide.

### 2. ¿Qué pasa si el usuario cambia de compañía después de autenticarse y antes de que expire el JWT? ¿Es un bug de seguridad?

Es un **comportamiento de seguridad aceptable con riesgos conocidos**, no un bug grave en el contexto de BildyApp. El JWT almacena el payload (`company`) en el momento de la firma; si el usuario cambia de compañía, el token antiguo seguirá teniendo la `company` anterior hasta que expire (15 minutos según `handleJwt.js`). En BildyApp, un operario de campo que es reasignado de "Empresa Reformas S.L." a "Empresa Instalaciones S.A." podría, durante esos 15 minutos, seguir emitiendo albaranes bajo la compañía anterior. Sin embargo, como los albaranes se asocian a `req.user.company` (que viene del payload del token, no de la BD en tiempo real), los documentos se crearían bajo la compañía correcta del token. El riesgo real sería bajo porque: (a) la ventana de tiempo es corta (15 min), (b) el middleware de Socket.IO usa el mismo token así que las salas WebSocket también reflejan el estado antiguo. La solución si fuera crítico sería reducir el TTL del JWT o revocar tokens al cambiar de compañía usando una lista negra o token versioning.

### 3. ¿Qué diferencia hay entre `deleted: { $ne: true }` y `deleted: false` en MongoDB?

La diferencia está en los documentos donde el campo `deleted` **no existe** o tiene valor **`null`**. Con `deleted: false`, MongoDB sólo matchea documentos donde el campo existe y su valor es literalmente el booleano `false` — un documento sin el campo `deleted`, o con `deleted: null`, **no** pasaría el filtro. Con `deleted: { $ne: true }`, MongoDB matchea cualquier documento donde `deleted` no sea exactamente `true`: esto incluye documentos con `deleted: false`, documentos donde `deleted` es `null`, y documentos donde el campo `deleted` directamente no existe. En una colección donde hay documentos creados antes de añadir el `softDeletePlugin` (que no tienen el campo `deleted`), `$ne: true` es más robusto porque los incluye correctamente como "no eliminados". Usar `deleted: false` en ese escenario los excluiría silenciosamente, rompiendo la funcionalidad. Por eso `$ne: true` es la elección correcta para el plugin de soft-delete.

### 4. ¿Permite el índice compuesto `{ company: 1, cif: 1 }` que dos empresas distintas tengan clientes con el mismo CIF?

Sí, el índice compuesto `{ company: 1, cif: 1 }` con `unique: true` garantiza unicidad sólo dentro de la combinación de ambos campos. Dos documentos con el mismo `cif` pero diferente `company` son perfectamente válidos y distintos desde el punto de vista del índice — la restricción de unicidad se evalúa sobre la tupla `(company, cif)`, no sobre `cif` solo. Esto es exactamente lo que necesita un sistema multi-tenant: cada empresa puede tener su propio cliente con CIF "B12345678" sin conflicto. Si en cambio usáramos un índice simple `{ cif: 1, unique: true }`, sólo una empresa en todo el sistema podría tener ese CIF, lo que rompería el aislamiento entre tenants. Además, el índice compuesto optimiza las queries más frecuentes del sistema: `Client.findOne({ cif, company: req.user.company })` usa el índice directamente sin scan completo de la colección.

### 5. Bloque JSDoc `@openapi` para `PATCH /api/deliverynote/:id/sign`

```yaml
/**
 * @openapi
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags:
 *       - DeliveryNote
 *     summary: Firmar un albarán con imagen de firma digital
 *     description: >
 *       Sube una imagen de firma, la optimiza con Sharp, la almacena en
 *       Cloudinary y genera el PDF firmado. Solo puede ejecutarse una vez
 *       por albarán (si ya está firmado devuelve 409).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del albarán a firmar
 *         schema:
 *           type: string
 *           example: "60d0fe4f5311236168a109ce"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la firma (PNG, JPG o WebP, máx 5MB)
 *     responses:
 *       200:
 *         description: Albarán firmado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Albarán firmado correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     signatureUrl:
 *                       type: string
 *                       format: uri
 *                     pdfUrl:
 *                       type: string
 *                       format: uri
 *                     signedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: No se envió la imagen de firma en el campo 'signature'
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado o no pertenece a tu compañía
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflicto — el albarán ya está firmado (estado del recurso impide la acción)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: true
 *               message: "Este albarán ya está firmado y no puede volver a firmarse"
 *               code: "CONFLICT"
 */
```

El `requestBody` usa `multipart/form-data` porque la imagen se sube como archivo binario con `multer`. El campo se llama `signature` (coincide con `upload.single('signature')` en la ruta). Se documenta el 400 para el caso de que no se envíe el archivo (validación del controlador, no del estado), el 404 para albarán no encontrado, y el 409 para el estado ya-firmado — diferenciando correctamente las tres clases de error.

---

## Proceso

**Tiempo total invertido:** ~2 horas

**Herramientas usadas:** VS Code, Antigravity (IA asistente de código), Node.js 22, Jest 30

**Descripción del proceso:**
1. Leí el código del controlador y `AppError.js` para entender el patrón existente.
2. Identifiqué la inconsistencia: `createClient` usa `conflict` correctamente; `deliverynote` usaba `badRequest` para el mismo patrón de "estado impide la acción".
3. Cambié las dos líneas en el controlador.
4. Instalé `jest`, `mongodb-memory-server` y `supertest` como devDependencies.
5. Configuré Jest para ESM (el proyecto usa `"type": "module"`), usando `--experimental-vm-modules` y `jest.unstable_mockModule()` para los mocks de ESM.
6. Escribí los 4 tests con patrón DADO/CUANDO/ENTONCES y verifiqué que pasan con `npm test`.
7. Redacté las respuestas socráticas.

**Prompts a IA (Antigravity):**
- "Reto: F1 — Semántica HTTP 400→409 en operaciones de albarán firmado + tests que documentan el contrato [...] explica paso a paso lo que has hecho para que vaya entendiendo los cambios y sigue el estilo de codigo que tiene la practica puedes consultar los mds de los temas"
