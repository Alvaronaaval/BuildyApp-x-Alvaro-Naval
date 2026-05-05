import { IncomingWebhook } from '@slack/webhook';

const webhook = process.env.SLACK_WEBHOOK
    ? new IncomingWebhook(process.env.SLACK_WEBHOOK)
    : null;

class LoggerService {
    async logError(err, req) {
        const message = [
            '*Error 5XX en BildyApp*',
            `*Timestamp:* ${new Date().toISOString()}`,
            `*Método:* ${req.method}`,
            `*Ruta:* ${req.originalUrl}`,
            `*Mensaje:* ${err.message}`,
            `\`\`\`${err.stack}\`\`\``
        ].join('\n');

        console.error(message);

        if (webhook) {
            try {
                await webhook.send({ text: message });
            } catch (error) {
                console.error('[SLACK] Error enviando a Slack:', error.message);
            }
        }
    }
}

export default new LoggerService();
