import { EventEmitter } from 'node:events';

const notificationService = new EventEmitter();

notificationService.on('user:registered', (usuario) => {
    console.log(`[Notificación] Nuevo usuario registrado: ${usuario.email}`);
});

notificationService.on('user:verified', (usuario) => {
    console.log(`[Notificación] Email verificado para: ${usuario.email}`);
});

notificationService.on('user:invited', (usuario) => {
    console.log(`[Notificación] Usuario invitado al sistema: ${usuario.email}`);
});

notificationService.on('user:deleted', (usuarioId) => {
    console.log(`[Notificación] Usuario eliminado con ID: ${usuarioId}`);
});

export default notificationService;