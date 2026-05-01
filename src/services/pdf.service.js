import PDFDocument from 'pdfkit';

class PdfService {
    generateDeliveryNotePdf(deliveryNote) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            this._addHeader(doc, deliveryNote);
            this._addClientInfo(doc, deliveryNote);
            this._addProjectInfo(doc, deliveryNote);
            this._addDeliveryNoteDetails(doc, deliveryNote);

            if (deliveryNote.signed && deliveryNote.signatureUrl) {
                this._addSignature(doc, deliveryNote);
            }

            this._addFooter(doc);

            doc.end();
        });
    }

    _addHeader(doc, deliveryNote) {
        doc.fontSize(20).text('ALBARÁN', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(10)
            .text(`Fecha de trabajo: ${new Date(deliveryNote.workDate).toLocaleDateString('es-ES')}`, { align: 'right' })
            .text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' })
            .text(`Tipo: ${deliveryNote.format === 'hours' ? 'Horas' : 'Material'}`, { align: 'right' });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();
    }

    _addClientInfo(doc, deliveryNote) {
        const client = deliveryNote.client;
        if (!client) return;

        doc.fontSize(12).text('Datos del cliente', { underline: true });
        doc.fontSize(10)
            .text(`Nombre: ${client.name || '-'}`)
            .text(`CIF: ${client.cif || '-'}`)
            .text(`Email: ${client.email || '-'}`);

        if (client.address) {
            const addr = client.address;
            doc.text(`Dirección: ${addr.street || ''} ${addr.number || ''}, ${addr.postal || ''} ${addr.city || ''} (${addr.province || ''})`);
        }

        doc.moveDown();
    }

    _addProjectInfo(doc, deliveryNote) {
        const project = deliveryNote.project;
        if (!project) return;

        doc.fontSize(12).text('Datos del proyecto', { underline: true });
        doc.fontSize(10)
            .text(`Proyecto: ${project.name || '-'}`)
            .text(`Código: ${project.projectCode || '-'}`);

        if (project.address) {
            const addr = project.address;
            doc.text(`Dirección obra: ${addr.street || ''} ${addr.number || ''}, ${addr.postal || ''} ${addr.city || ''} (${addr.province || ''})`);
        }

        doc.moveDown();
    }

    _addDeliveryNoteDetails(doc, deliveryNote) {
        doc.fontSize(12).text('Detalle del albarán', { underline: true });
        doc.moveDown(0.5);

        if (deliveryNote.description) {
            doc.fontSize(10).text(`Descripción: ${deliveryNote.description}`);
            doc.moveDown(0.5);
        }

        if (deliveryNote.format === 'material') {
            this._addMaterialTable(doc, deliveryNote);
        } else {
            this._addHoursTable(doc, deliveryNote);
        }

        doc.moveDown();
    }

    _addMaterialTable(doc, deliveryNote) {
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 300;
        const col3 = 420;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Material', col1, tableTop);
        doc.text('Cantidad', col2, tableTop);
        doc.text('Unidad', col3, tableTop);

        doc.moveTo(col1, tableTop + 15).lineTo(545, tableTop + 15).stroke();

        doc.font('Helvetica');
        doc.text(deliveryNote.material || '-', col1, tableTop + 20);
        doc.text(String(deliveryNote.quantity || 0), col2, tableTop + 20);
        doc.text(deliveryNote.unit || '-', col3, tableTop + 20);
    }

    _addHoursTable(doc, deliveryNote) {
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 350;

        if (deliveryNote.workers && deliveryNote.workers.length > 0) {
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Trabajador', col1, tableTop);
            doc.text('Horas', col2, tableTop);

            doc.moveTo(col1, tableTop + 15).lineTo(545, tableTop + 15).stroke();

            doc.font('Helvetica');
            let yPos = tableTop + 20;
            let totalHours = 0;

            for (const worker of deliveryNote.workers) {
                doc.text(worker.name, col1, yPos);
                doc.text(String(worker.hours), col2, yPos);
                totalHours += worker.hours;
                yPos += 18;
            }

            doc.moveTo(col1, yPos).lineTo(545, yPos).stroke();
            yPos += 5;
            doc.font('Helvetica-Bold');
            doc.text('Total horas:', col1, yPos);
            doc.text(String(totalHours), col2, yPos);
        } else {
            doc.fontSize(10).text(`Horas totales: ${deliveryNote.hours || 0}`);
        }
    }

    _addSignature(doc, deliveryNote) {
        doc.moveDown(2);
        doc.fontSize(12).text('Firma', { underline: true });
        doc.fontSize(10).text(`Firmado el: ${new Date(deliveryNote.signedAt).toLocaleDateString('es-ES')}`);
        doc.moveDown(0.5);
        doc.text('[Firma digital registrada]', { align: 'center' });
    }

    _addFooter(doc) {
        doc.moveDown(3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(8)
            .fillColor('#888888')
            .text('Documento generado automáticamente por BildyApp', { align: 'center' });
    }
}

export default new PdfService();
