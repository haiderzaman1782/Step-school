import PDFDocument from 'pdfkit';
import fs from 'fs';

// ── Legacy voucher PDF (kept for existing system) ──────────
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

// ── School Voucher PDF (new client-program-payment system) ─
const PAYMENT_TYPE_LABELS = {
    advance: 'Advance Payment',
    after_pre_registration: 'After Pre-Registration',
    submitted_examination: 'After Examination Submission',
    roll_number_slip: 'Roll Number Slip Issuance',
};

const pkr = (amount) =>
    `PKR ${parseFloat(amount).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const generateSchoolVoucherPDF = (voucher, stream) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(stream);

    const accentColor = '#1e3a5f';
    const lightGray = '#f4f6f9';

    // ── Header bar ──────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(accentColor);
    doc.fillColor('white')
        .fontSize(24).font('Helvetica-Bold')
        .text('Step School', 50, 22);
    doc.fontSize(11).font('Helvetica')
        .text('Fee Payment Voucher', 50, 52);

    // Voucher number top-right
    doc.fontSize(10)
        .text(voucher.voucher_number, 0, 30, { align: 'right', width: doc.page.width - 50 });
    doc.text(new Date().toLocaleDateString('en-PK'), 0, 45, { align: 'right', width: doc.page.width - 50 });

    // ── Client info section ──────────────────────────────────
    let y = 110;
    doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold')
        .text('Client Information', 50, y);
    doc.moveTo(50, y + 17).lineTo(545, y + 17).stroke(accentColor);

    y += 25;
    doc.rect(50, y, 495, 90).fill(lightGray);

    const left = 60;
    const right = 310;
    doc.fillColor('#333').fontSize(10).font('Helvetica');

    doc.font('Helvetica-Bold').text('Client Name:', left, y + 10);
    doc.font('Helvetica').text(voucher.client_name || '—', left + 90, y + 10);

    doc.font('Helvetica-Bold').text('City:', left, y + 28);
    doc.font('Helvetica').text(voucher.client_city || '—', left + 90, y + 28);

    doc.font('Helvetica-Bold').text('Campus:', left, y + 46);
    doc.font('Helvetica').text(voucher.campus_name || '—', left + 90, y + 46);

    doc.font('Helvetica-Bold').text('Total Seats:', right, y + 10);
    doc.font('Helvetica').text(String(voucher.total_seats || 0), right + 90, y + 10);

    doc.font('Helvetica-Bold').text('Seat Cost:', right, y + 28);
    doc.font('Helvetica').text(pkr(voucher.seat_cost || 0), right + 90, y + 28);

    doc.font('Helvetica-Bold').text('Total Amount:', right, y + 46);
    doc.font('Helvetica').text(pkr(voucher.total_amount || 0), right + 90, y + 46);

    // ── Payment details section ──────────────────────────────
    y += 110;
    doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold')
        .text('Payment Details', 50, y);
    doc.moveTo(50, y + 17).lineTo(545, y + 17).stroke(accentColor);

    y += 25;
    // Table header
    doc.rect(50, y, 495, 22).fill(accentColor);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
        .text('Payment Type', 60, y + 6)
        .text('Voucher #', 250, y + 6)
        .text('Amount Due', 400, y + 6, { width: 135, align: 'right' });

    // Table row
    y += 22;
    doc.rect(50, y, 495, 28).fill('#fff').stroke('#ddd');
    const payLabel = PAYMENT_TYPE_LABELS[voucher.payment_type] || voucher.payment_type;
    doc.fillColor('#333').fontSize(10).font('Helvetica')
        .text(payLabel, 60, y + 9)
        .text(voucher.voucher_number, 250, y + 9);
    doc.font('Helvetica-Bold')
        .text(pkr(voucher.amount), 400, y + 9, { width: 135, align: 'right' });

    // Total row
    y += 28;
    doc.rect(50, y, 495, 30).fill(lightGray).stroke('#ccc');
    doc.fillColor(accentColor).fontSize(13).font('Helvetica-Bold')
        .text('Amount Due:', 60, y + 8)
        .text(pkr(voucher.amount), 400, y + 8, { width: 135, align: 'right' });

    // ── Status badge ─────────────────────────────────────────
    y += 50;
    const statusColor = voucher.status === 'paid' ? '#16a34a' : (voucher.status === 'cancelled' ? '#dc2626' : '#d97706');
    doc.roundedRect(50, y, 120, 28, 6).fill(statusColor);
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
        .text(voucher.status.toUpperCase(), 50, y + 8, { width: 120, align: 'center' });

    // Generated by
    if (voucher.generated_by_name) {
        doc.fillColor('#555').fontSize(9).font('Helvetica')
            .text(`Generated by: ${voucher.generated_by_name}`, 200, y + 10)
            .text(`Date: ${new Date(voucher.generated_date).toLocaleDateString('en-PK')}`, 390, y + 10);
    }

    // ── Footer ───────────────────────────────────────────────
    const footerY = doc.page.height - 60;
    doc.rect(0, footerY, doc.page.width, 60).fill(accentColor);
    doc.fillColor('white').fontSize(9).font('Helvetica')
        .text('This is a computer-generated document. No signature required.', 50, footerY + 15, { align: 'center', width: doc.page.width - 100 })
        .text('Step School Management System', 50, footerY + 30, { align: 'center', width: doc.page.width - 100 });

    doc.end();
};
