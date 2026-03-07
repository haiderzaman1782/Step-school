'use client';
import React, { useEffect, useState } from 'react';
import { vouchersService } from '../../app/services/vouchersService.js';
import {
    X, Receipt, Building2, MapPin, Calendar, Wallet,
    FileText, User, CreditCard, Download, CheckCircle2,
    Clock, AlertCircle, XCircle, ChevronRight
} from 'lucide-react';

const PAYMENT_TYPE_LABELS = {
    advance: 'Initial Advance',
    after_pre_registration: 'Post-Registration',
    submitted_examination: 'Exam Submission',
    roll_number_slip: 'Roll Number Slip',
};

const STATUS_CONFIG = {
    pending:   { icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50',   label: 'Pending' },
    partial:   { icon: AlertCircle, color: 'text-indigo-600',  bg: 'bg-indigo-50',  label: 'Partial' },
    paid:      { icon: CheckCircle2,color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Settled' },
    cancelled: { icon: XCircle,     color: 'text-rose-600',    bg: 'bg-rose-50',    label: 'Cancelled' },
};

const formatPkr = (n) =>
    parseFloat(n || 0).toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function VoucherDetailModal({ voucherId, onClose, onRecordPayment }) {
    const [voucher, setVoucher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await vouchersService.getById(voucherId);
                setVoucher(data);
            } catch (e) {
                setError(e.response?.data?.error || e.message);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [voucherId]);

    const statusConf = voucher ? (STATUS_CONFIG[voucher.status] || STATUS_CONFIG.pending) : STATUS_CONFIG.pending;
    const StatusIcon = statusConf.icon;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-6 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-card w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-300 my-auto">

                {/* Header */}
                <div className="p-7 pb-5 flex items-center justify-between border-b border-border/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-primary tracking-tight">Voucher Detail</h3>
                            {voucher && <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 font-mono">{voucher.voucher_number}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-7 space-y-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 animate-pulse">Loading...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-bold border border-destructive/20">
                            {error}
                        </div>
                    )}

                    {voucher && !loading && (
                        <>
                            {/* Status Badge */}
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${statusConf.bg} ${statusConf.color}`}>
                                <StatusIcon className="w-4 h-4" />
                                {statusConf.label}
                            </div>

                            {/* School Info */}
                            <div className="bg-muted/5 border border-border/30 rounded-2xl p-5 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Institution</p>
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                    <span className="font-bold text-sm">{voucher.client_name}</span>
                                </div>
                                {voucher.director_name && (
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary/40 shrink-0" />
                                        <span className="text-sm font-semibold text-primary/80">{voucher.director_name}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Director</span>
                                    </div>
                                )}
                                {voucher.client_city && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                        <span className="text-sm text-muted-foreground">{voucher.client_city}</span>
                                    </div>
                                )}
                            </div>

                            {/* Financial Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-muted/5 border border-border/30 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Total</p>
                                    <p className="text-sm font-black text-foreground">{formatPkr(voucher.amount)}</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Received</p>
                                    <p className="text-sm font-black text-emerald-700">{formatPkr(voucher.amount_paid)}</p>
                                </div>
                                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 mb-1">Balance</p>
                                    <p className="text-sm font-black text-rose-600">{formatPkr(voucher.balance)}</p>
                                </div>
                            </div>

                            {/* Metadata rows */}
                            <div className="space-y-3">
                                {voucher.milestone_name && (
                                    <Row icon={<CreditCard className="w-4 h-4" />} label="Milestone" value={PAYMENT_TYPE_LABELS[voucher.milestone_name] || voucher.milestone_name} />
                                )}
                                {voucher.payment_method && (
                                    <Row icon={<Wallet className="w-4 h-4" />} label="Payment Channel" value={voucher.payment_method} />
                                )}
                                {voucher.due_date && (
                                    <Row icon={<Calendar className="w-4 h-4" />} label="Due Date" value={formatDate(voucher.due_date)} />
                                )}
                                {voucher.paid_date && (
                                    <Row icon={<Calendar className="w-4 h-4" />} label="Paid On" value={formatDate(voucher.paid_date)} />
                                )}
                                {voucher.generated_by_accountant_name && (
                                    <Row icon={<User className="w-4 h-4" />} label="Issued By" value={voucher.generated_by_accountant_name} />
                                )}
                                {voucher.paid_by_accountant_name && (
                                    <Row icon={<User className="w-4 h-4" />} label="Collected By" value={voucher.paid_by_accountant_name} />
                                )}
                                <Row icon={<Calendar className="w-4 h-4" />} label="Issued On" value={formatDate(voucher.created_at)} />
                            </div>

                            {/* Notes */}
                            {voucher.payment_notes && (
                                <div className="bg-muted/5 border border-border/30 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-muted-foreground/40" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Payment Notes</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{voucher.payment_notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => vouchersService.downloadPDF(voucher.id, voucher.voucher_number, voucher.director_name)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted/30 rounded-2xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-colors"
                                >
                                    <Download className="w-4 h-4" /> PDF
                                </button>
                                {voucher.status !== 'paid' && voucher.status !== 'cancelled' && onRecordPayment && (
                                    <button
                                        onClick={() => { onClose(); onRecordPayment(voucher); }}
                                        className="flex-[2] flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-lg hover:shadow-indigo-500/20"
                                    >
                                        <Wallet className="w-4 h-4" /> Record Payment
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Row({ icon, label, value }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
            <div className="flex items-center gap-2 text-muted-foreground/50">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-sm font-bold text-foreground">{value}</span>
        </div>
    );
}
