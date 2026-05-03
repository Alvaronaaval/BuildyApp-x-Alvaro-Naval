import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

class MailService {
    async sendVerificationCode(to, code) {
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject: 'BildyApp — Código de verificación',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Verifica tu cuenta</h2>
                    <p>Tu código de verificación es:</p>
                    <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 20px 0;">
                        ${code}
                    </div>
                    <p style="color: #666; font-size: 14px;">Este código expira en 15 minutos. Si no has solicitado este código, ignora este email.</p>
                </div>
            `
        };

        try {
            const result = await transporter.sendMail(mailOptions);
            console.log(`[MAIL] Código de verificación enviado a ${to}`);
            return result;
        } catch (error) {
            console.error(`[MAIL] Error enviando email a ${to}:`, error.message);
        }
    }
}

export default new MailService();
