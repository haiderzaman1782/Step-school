import PDFDocument from 'pdfkit';
import fs from 'fs';

export const generateVoucherPDF = (voucher, stream) => {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('PAYMENT VOUCHER', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Voucher Number: ${voucher.voucher_number}`, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Company Info (Placeholder)
    doc.fontSize(12).text('Step School Management', { underline: true });
    doc.fontSize(10).text('123 Education St, Knowledge City');
    doc.text('Phone: +1-234-567-890');
    doc.moveDown();

    // Client Info
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10).text(`Name: ${voucher.client_name}`);
    doc.text(`Email: ${voucher.client_email}`);
    if (voucher.client_phone) doc.text(`Phone: ${voucher.client_phone}`);
    if (voucher.client_address) doc.text(`Address: ${voucher.client_address}`);
    doc.moveDown();

    // Voucher Details
    doc.fontSize(12).text('Voucher Details:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = 300;
    doc.fontSize(10);
    doc.text('Description', 50, tableTop);
    doc.text('Type', 250, tableTop);
    doc.text('Due Date', 350, tableTop);
    doc.text('Amount', 450, tableTop, { align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    const itemY = tableTop + 25;
    doc.text(voucher.description || 'Service Fee', 50, itemY);
    doc.text(voucher.payment_type_name, 250, itemY);
    doc.text(new Date(voucher.due_date).toLocaleDateString(), 350, itemY);
    doc.text(`$${parseFloat(voucher.amount).toFixed(2)}`, 450, itemY, { align: 'right' });

    doc.moveTo(50, itemY + 15).lineTo(550, itemY + 15).stroke();

    // Total
    doc.fontSize(12).text(`Total Amount: $${parseFloat(voucher.amount).toFixed(2)}`, 350, itemY + 40, { align: 'right', bold: true });

    // Status
    doc.moveDown(4);
    doc.fontSize(14).fillColor(voucher.status === 'paid' ? 'green' : 'red').text(`STATUS: ${voucher.status.toUpperCase()}`, { align: 'center' });

    // Footer
    doc.fillColor('black').fontSize(10).text('Thank you for your business!', 50, doc.page.height - 100, { align: 'center' });
    doc.text('This is a computer-generated voucher.', 50, doc.page.height - 85, { align: 'center' });

    doc.end();
};
