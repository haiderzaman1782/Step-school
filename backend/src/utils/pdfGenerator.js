import PDFDocument from 'pdfkit';
import fs from 'fs';

// ── Legacy voucher PDF (kept for existing system) ──────────
export const generateVoucherPDF = (voucher, stream) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);
    doc.fontSize(20).text('PAYMENT VOUCHER', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Voucher Number: ${voucher.voucher_number}`, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(12).text('Step School Management', { underline: true });
    doc.fontSize(10).text('123 Education St, Knowledge City');
    doc.text('Phone: +1-234-567-890');
    doc.moveDown();
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10).text(`Name: ${voucher.client_name}`);
    doc.text(`Email: ${voucher.client_email}`);
    if (voucher.client_phone) doc.text(`Phone: ${voucher.client_phone}`);
    if (voucher.client_address) doc.text(`Address: ${voucher.client_address}`);
    doc.moveDown();
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
    doc.fontSize(12).text(`Total Amount: $${parseFloat(voucher.amount).toFixed(2)}`, 350, itemY + 40, { align: 'right', bold: true });
    doc.moveDown(4);
    doc.fontSize(14).fillColor(voucher.status === 'paid' ? 'green' : 'red').text(`STATUS: ${voucher.status.toUpperCase()}`, { align: 'center' });
    doc.fillColor('black').fontSize(10).text('Thank you for your business!', 50, doc.page.height - 100, { align: 'center' });
    doc.text('This is a computer-generated voucher.', 50, doc.page.height - 85, { align: 'center' });
    doc.end();
};

// ── School Voucher PDF — Premium Design ────────────────────

const MILESTONE_LABELS = {
    advance:               'Initial Advance',
    after_pre_registration:'Post-Registration',
    submitted_examination: 'Exam Submission',
    roll_number_slip:      'Roll Number Slip',
};

const CHANNEL_LABELS = {
    Cash:            'Cash Deposit',
    'Bank Transfer': 'Bank Transfer',
    Cheque:          'Physical Cheque',
    Online:          'Online Portal',
};

const pkr = (n) =>
    `PKR ${parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtDate = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
};

const hLine = (doc, x1, x2, y, color = '#e2e8f0', thickness = 0.5) => {
    doc.save().moveTo(x1, y).lineTo(x2, y).lineWidth(thickness).strokeColor(color).stroke().restore();
};

const kvRow = (doc, label, value, lx, rx, y, lW = 90) => {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b')
        .text(label, lx, y, { width: lW });
    doc.font('Helvetica').fontSize(9.5).fillColor('#0f172a')
        .text(value || '—', rx, y, { width: 190 });
};

export const generateSchoolVoucherPDF = (voucher, stream) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    doc.pipe(stream);

    const W = doc.page.width;   // 595
    const H = doc.page.height;  // 842
    const M = 42;               // margin
    const IW = W - M * 2;       // inner width

    // ─── Colour palette ──────────────────────────────────────
    const navy    = '#1e3a5f';
    const blue    = '#2563eb';
    const green   = '#16a34a';
    const amber   = '#d97706';
    const rose    = '#dc2626';
    const slate   = '#64748b';
    const bgCard  = '#f1f5f9';
    const bgGreen = '#f0fdf4';
    const bgRose  = '#fff1f2';

    const statusColorMap = { paid: green, partial: blue, pending: amber, cancelled: rose };
    const statusColor = statusColorMap[voucher.status] || amber;
    const statusLabel = (voucher.status || 'pending').toUpperCase();

    // ════════════════════════════════════════════════════════
    // HEADER
    // ════════════════════════════════════════════════════════
    doc.rect(0, 0, W, 105).fill(navy);
    doc.rect(0, 99, W, 6).fill(blue);   // accent stripe

    // Brand name
    doc.fillColor('white').font('Helvetica-Bold').fontSize(28)
        .text('STEP SCHOOL', M, 20, { characterSpacing: 2 });
    doc.font('Helvetica').fontSize(9.5).fillColor('#93c5fd')
        .text('Official Fee Payment Voucher  ·  Management System', M, 56);

    // Right-aligned voucher meta
    doc.font('Helvetica-Bold').fontSize(11).fillColor('white')
        .text(voucher.voucher_number || '', 0, 22, { align: 'right', width: W - M });
    doc.font('Helvetica').fontSize(8.5).fillColor('#93c5fd')
        .text(`Issued: ${fmtDate(voucher.created_at)}`, 0, 42, { align: 'right', width: W - M });
    doc.font('Helvetica').fontSize(8.5).fillColor('#93c5fd')
        .text(`Due:    ${fmtDate(voucher.due_date)}`, 0, 56, { align: 'right', width: W - M });

    // ════════════════════════════════════════════════════════
    // SECTION: INSTITUTION PROFILE
    // ════════════════════════════════════════════════════════
    let y = 118;
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
        .text('INSTITUTION PROFILE', M, y, { characterSpacing: 1 });
    hLine(doc, M, W - M, y + 15, navy, 1.2);

    // Build rows only for what's available
    const instFields = [];
    if (voucher.client_name)  instFields.push({ label: 'School Name:',  val: voucher.client_name });
    if (voucher.director_name) instFields.push({ label: 'Director:', val: voucher.director_name, highlight: true });
    if (voucher.client_city)  instFields.push({ label: 'City:',         val: voucher.client_city });
    if (voucher.campus_name)  instFields.push({ label: 'Campus:',       val: voucher.campus_name });

    const instRight = [];
    if (voucher.total_seats  && voucher.total_seats > 0)   instRight.push({ label: 'Total Seats:',    val: String(voucher.total_seats) });
    if (voucher.seat_cost    && voucher.seat_cost > 0)     instRight.push({ label: 'Per Seat Cost:',  val: pkr(voucher.seat_cost) });
    if (voucher.total_amount && voucher.total_amount > 0)  instRight.push({ label: 'Contract Value:', val: pkr(voucher.total_amount) });
    if (voucher.total_programs && voucher.total_programs > 0) instRight.push({ label: 'Programs:', val: String(voucher.total_programs) });

    const leftRows  = Math.max(instFields.length, 1);
    const rightRows = instRight.length;
    const instH = Math.max(leftRows, rightRows) * 22 + 18;

    doc.rect(M, y, IW, instH).fill(bgCard);

    const lCol = M + 10;
    const rCol = M + IW / 2 + 12;
    const lLabel = lCol + 95;
    const rLabel = rCol + 85;

    instFields.forEach((field, i) => {
        const fy = y + 10 + i * 22;
        if (field.highlight) {
            // Director name gets styled differently — slightly larger, navy colour
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b')
                .text(field.label, lCol, fy, { width: 92 });
            doc.font('Helvetica-Bold').fontSize(10.5).fillColor(navy)
                .text(field.val, lLabel, fy - 1, { width: 200 });
        } else {
            kvRow(doc, field.label, field.val, lCol, lLabel, fy);
        }
    });

    instRight.forEach((field, i) => {
        kvRow(doc, field.label, field.val, rCol, rLabel, y + 10 + i * 22, 85);
    });

    // ════════════════════════════════════════════════════════
    // SECTION: PAYMENT SUMMARY
    // ════════════════════════════════════════════════════════
    y += instH + 18;
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
        .text('PAYMENT SUMMARY', M, y, { characterSpacing: 1 });
    hLine(doc, M, W - M, y + 15, navy, 1.2);

    y += 24;

    const cDesc   = M + 8;
    const cVou    = M + 185;
    const cAmt    = M + IW - 8;

    // Table header bar
    doc.rect(M, y, IW, 23).fill(navy);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(8.5)
        .text('Milestone / Description', cDesc,   y + 7, { width: 170 })
        .text('Voucher Reference',       cVou,    y + 7, { width: 150 })
        .text('Amount (PKR)',            0,        y + 7, { align: 'right', width: W - M - 8 });

    // Main row
    y += 23;
    const milestone = MILESTONE_LABELS[voucher.milestone_name] || voucher.milestone_name || 'General Payment';
    doc.rect(M, y, IW, 30).fill('#ffffff').stroke('#e2e8f0');
    doc.fillColor('#0f172a').font('Helvetica').fontSize(9)
        .text(milestone,               cDesc,  y + 10, { width: 170 })
        .text(voucher.voucher_number || '', cVou, y + 10, { width: 150 });
    doc.font('Helvetica-Bold').fontSize(10.5)
        .text(pkr(voucher.amount),     0, y + 10, { align: 'right', width: W - M - 8 });

    // Received row
    y += 30;
    doc.rect(M, y, IW, 26).fill(bgGreen).stroke('#bbf7d0');
    doc.fillColor(green).font('Helvetica-Bold').fontSize(9)
        .text('✓  Amount Received', cDesc, y + 8, { width: 220 });
    doc.fontSize(10).text(pkr(voucher.amount_paid || 0), 0, y + 8, { align: 'right', width: W - M - 8 });

    // Outstanding balance row
    y += 26;
    const isCleared = parseFloat(voucher.balance || 0) <= 0;
    doc.rect(M, y, IW, 26).fill(isCleared ? bgGreen : bgRose).stroke(isCleared ? '#bbf7d0' : '#fecaca');
    doc.fillColor(isCleared ? green : rose).font('Helvetica-Bold').fontSize(9)
        .text('Outstanding Balance', cDesc, y + 8, { width: 220 });
    doc.fontSize(10).text(pkr(voucher.balance || 0), 0, y + 8, { align: 'right', width: W - M - 8 });

    // ════════════════════════════════════════════════════════
    // SECTION: TRANSACTION DETAILS
    // ════════════════════════════════════════════════════════
    y += 40;
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
        .text('TRANSACTION DETAILS', M, y, { characterSpacing: 1 });
    hLine(doc, M, W - M, y + 15, navy, 1.2);

    y += 24;
    doc.rect(M, y, IW, 88).fill(bgCard);

    const txL  = M + 10;
    const txR  = M + IW / 2 + 12;
    const txLV = txL + 90;
    const txRV = txR + 90;

    kvRow(doc, 'Payment Channel:', CHANNEL_LABELS[voucher.payment_method] || voucher.payment_method || '—', txL, txLV, y + 10);
    kvRow(doc, 'Payment Date:',    fmtDate(voucher.paid_date),   txL,  txLV, y + 32);
    kvRow(doc, 'Voucher Status:',  statusLabel,                  txL,  txLV, y + 54);
    kvRow(doc, 'Voucher ID:',      String(voucher.id || '—'),    txL,  txLV, y + 72, 90);

    kvRow(doc, 'Issued By:',      voucher.generated_by_accountant_name || '—', txR, txRV, y + 10, 80);
    kvRow(doc, 'Collected By:',   voucher.paid_by_accountant_name      || '—', txR, txRV, y + 32, 80);
    kvRow(doc, 'Issue Date:',     fmtDate(voucher.created_at),                  txR, txRV, y + 54, 80);

    // ════════════════════════════════════════════════════════
    // NOTES (conditional)
    // ════════════════════════════════════════════════════════
    y += 100;
    if (voucher.payment_notes && voucher.payment_notes.trim()) {
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
            .text('PAYMENT NOTES', M, y, { characterSpacing: 1 });
        hLine(doc, M, W - M, y + 15, navy, 1.2);
        y += 24;
        const noteLines = Math.max(1, Math.ceil(voucher.payment_notes.length / 90));
        const noteH = 16 + noteLines * 13;
        doc.rect(M, y, IW, noteH).fill('#fefce8').stroke('#fde68a');
        doc.fillColor('#78350f').font('Helvetica').fontSize(9)
            .text(voucher.payment_notes, M + 10, y + 8, { width: IW - 20, lineGap: 3 });
        y += noteH + 20;
    }

    // ════════════════════════════════════════════════════════
    // SIGNATURE LINE
    // ════════════════════════════════════════════════════════
    y = Math.max(y, H - 155);
    hLine(doc, M, M + 150, y + 28, '#334155', 0.7);
    doc.fillColor(slate).font('Helvetica').fontSize(8)
        .text('Authorized Signatory', M, y + 32, { width: 150, align: 'center' });
    doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8')
        .text('Step School Management', M, y + 43, { width: 150, align: 'center' });

    hLine(doc, W - M - 150, W - M, y + 28, '#334155', 0.7);
    doc.fillColor(slate).font('Helvetica').fontSize(8)
        .text('Finance Officer / Accountant', W - M - 150, y + 32, { width: 150, align: 'center' });
    doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8')
        .text('Accounts Department', W - M - 150, y + 43, { width: 150, align: 'center' });

    // ════════════════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════════════════
    const fY = H - 58;
    doc.rect(0, fY, W, 3).fill(blue);
    doc.rect(0, fY + 3, W, 55).fill(navy);

    doc.fillColor('white').font('Helvetica-Bold').fontSize(8.5)
        .text('STEP SCHOOL MANAGEMENT SYSTEM', M, fY + 12, { align: 'center', width: IW });
    doc.fillColor('#93c5fd').font('Helvetica').fontSize(7.5)
        .text('This is a system-generated document. Valid without a physical signature unless otherwise stated.',
              M, fY + 26, { align: 'center', width: IW });
    doc.fillColor('#60a5fa').font('Helvetica').fontSize(7)
        .text('For queries: accounts@stepschool.edu.pk  |  Helpline: +92-xxx-xxxxxxx',
              M, fY + 39, { align: 'center', width: IW });

    doc.end();
};
