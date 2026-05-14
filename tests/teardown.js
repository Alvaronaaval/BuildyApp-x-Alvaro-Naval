// tests/teardown.js
// Global teardown: detiene MongoMemoryServer al finalizar todos los tests.

export default async function globalTeardown() {
    if (global.__MONGOD__) {
        await global.__MONGOD__.stop();
    }
}
