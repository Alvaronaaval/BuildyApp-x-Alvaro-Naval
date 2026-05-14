// tests/setup.js
// Global setup: arranca MongoMemoryServer ANTES de que arranquen los tests.
// Jest lo ejecuta en un proceso separado (globalSetup), por eso usamos
// global.__MONGO_URI__ para pasar la URI a los tests.

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export default async function globalSetup() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Jest globalSetup corre en un worker diferente: la única forma de
    // pasar datos a los tests es con process.env o fichero temporal.
    process.env.MONGO_URI = uri;

    // Guardamos la referencia para teardown
    global.__MONGOD__ = mongod;
}
