import { EventEmitter } from 'node:events';

class NotificationService extends EventEmitter { }

export const notificationService = new NotificationService();

notificationService.on('user:registered', (email) => {
    console.log(`[EVENT] Nuevo usuario registrado: ${email}`);
});

notificationService.on('user:verified', (email) => {
    console.log(`[EVENT] Email de usuario verificado: ${email}`);
});

notificationService.on('user:invited', (email, by) => {
    console.log(`[EVENT] Usuario ${email} invitado por ${by}`);
});

notificationService.on('user:deleted', (email) => {
    console.log(`[EVENT] Usuario eliminado: ${email}`);
});