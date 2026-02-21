'use client';
import React, { useEffect, useState } from 'react';
import { clientsService } from '../../app/services/clientsService.js';
import { vouchersService } from '../../app/services/vouchersService.js';
import GenerateVoucherModal from './GenerateVoucherModal.jsx';
import {
    Building2,
    MapPin,
    Users,
    DollarSign,
    Receipt,
    History,
    FilePlus,
    ArrowLeft
} from 'lucide-react';

const formatPkr = (n) =>
    parseFloat(n || 0).toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

const PAYMENT_TYPE_LABELS = {
    advance: 'Initial Advance',
    after_pre_registration: 'Post-Registration',
    submitted_examination: 'Exam Submission',
    roll_number_slip: 'Roll Number Slip',
};

export default function ClientDetail({ clientId, onBack, isClientView = false }) {
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [milestoneToPrefill, setMilestoneToPrefill] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const data = await clientsService.getById(clientId);
            setClient(data);
        } catch (e) {
            setError(e.response?.data?.error || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [clientId]);

    const handleGenerateVoucher = (milestone) => {
        setMilestoneToPrefill({
            payment_plan_id: milestone.id,
            payment_type: milestone.payment_type,
            amount: milestone.amount,
            due_date: milestone.due_date ? new Date(milestone.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setShowVoucherModal(true);
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
    if (error) return <div className="p-8 text-destructive bg-destructive/10 rounded-xl">{error}</div>;
    if (!client) return <div className="p-8 text-center text-muted-foreground">Client record not found.</div>;

    return (
        <div className="client-detail-container pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex flex-col gap-4">
                    {!isClientView && (
                        <button onClick={onBack} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
                        </button>
                    )}
                    <div className="header-info">
                        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-1 break-words">{client.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 flex-shrink-0" /> {client.city}</span>
                            <span className="flex items-center gap-1.5 font-medium text-foreground/80"><Building2 className="w-4 h-4 flex-shrink-0" /> Director: {client.director_name}</span>
                        </div>
                    </div>
                </div>

                {isClientView ? (
                    <div className="bg-primary/5 border border-primary/10 px-4 py-2 rounded-lg self-start md:self-auto">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Your Private Portal</span>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowVoucherModal(true)}
                        className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-100 transition-all shadow-sm border border-indigo-100"
                    >
                        <FilePlus className="w-4 h-4" /> Issue Manual Voucher
                    </button>
                )}
            </header>

            {/* Summary Cards */}
            <div className="summary-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="card p-5 md:p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-primary mb-4" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Enrolled Seats</p>
                        <p className="text-2xl md:text-3xl font-bold">{client.total_seats}</p>
                    </div>
                </div>
                <div className="card p-5 md:p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-success mb-4" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Contract Value</p>
                        <p className="text-2xl md:text-3xl font-bold">{formatPkr(client.total_amount)}</p>
                    </div>
                </div>
                <div className="card p-5 md:p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <Receipt className="w-6 h-6 md:w-8 md:h-8 text-destructive mb-4" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Outstanding Balance</p>
                        <p className="text-2xl md:text-3xl font-bold text-destructive">
                            {formatPkr(client.total_amount - client.payment_history.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0))}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Payment Milestones (Actionable) */}
                <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center gap-2">
                        <FilePlus className="w-5 h-5 text-primary" />
                        <h3 className="font-bold">Fee Schedule & Milestones</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {client.payment_plan.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground italic text-sm">
                                No fee schedule defined for this institution yet.
                                {!isClientView && (
                                    <p className="text-xs mt-1 opacity-60">Use the voucher section to issue manual payments.</p>
                                )}
                            </div>
                        ) : client.payment_plan.map(m => {
                            // Find linked voucher from milestone_vouchers (includes pending/partial)
                            const linkedVoucher = (client.milestone_vouchers || []).find(
                                v => v.payment_plan_id === m.id
                            );
                            const isPaid = linkedVoucher?.status === 'paid';
                            const isPartial = linkedVoucher?.status === 'partial';
                            const isPending = linkedVoucher?.status === 'pending';

                            const cardBg = isPaid
                                ? 'bg-success/5 border-success/20'
                                : isPartial
                                    ? 'bg-amber-50 border-amber-200'
                                    : isPending
                                        ? 'bg-indigo-50 border-indigo-200'
                                        : 'bg-background border-border hover:border-primary/30';

                            return (
                                <div key={m.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${cardBg}`}>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-sm">{PAYMENT_TYPE_LABELS[m.payment_type] || m.payment_type}</span>
                                        <span className="text-base font-mono text-muted-foreground">{formatPkr(linkedVoucher?.amount ?? m.amount)}</span>
                                        {/* Show voucher details when issued but unpaid/partial */}
                                        {linkedVoucher && !isPaid && (
                                            <div className="mt-1 flex flex-col gap-0.5 text-[10px] font-mono opacity-70">
                                                <span>#{linkedVoucher.voucher_number}</span>
                                                {(isPartial || isPending) && (
                                                    <>
                                                        <span className="text-success font-bold">
                                                            Paid: {formatPkr(linkedVoucher.amount_paid)}
                                                        </span>
                                                        <span className="text-destructive font-bold">
                                                            Due: {formatPkr(linkedVoucher.balance)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="milestone-action flex flex-col items-end gap-1">
                                        {isPaid ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-success uppercase tracking-wider">
                                                Settled ✅
                                            </span>
                                        ) : isPartial ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 uppercase tracking-wider">
                                                Partial ⏳
                                            </span>
                                        ) : isPending ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                                Awaiting Payment
                                            </span>
                                        ) : !isClientView ? (
                                            <button
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-all"
                                                onClick={() => handleGenerateVoucher(m)}
                                            >
                                                Generate Voucher
                                            </button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic font-medium">Not Issued</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Manual Vouchers Section */}
                        {client.milestone_vouchers?.some(v => !v.payment_plan_id) && (
                            <div className="pt-4 mt-4 border-t border-border/10">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3 px-1">Other Issued Vouchers</h4>
                                <div className="space-y-3">
                                    {client.milestone_vouchers.filter(v => !v.payment_plan_id).map(v => (
                                        <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/10">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-wide">Manual / Unallocated</span>
                                                <span className="text-sm font-bold">{formatPkr(v.amount)}</span>
                                                <span className="text-[10px] font-mono opacity-60">#{v.voucher_number} • {v.status.toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${v.status === 'paid' ? 'bg-success/10 text-success' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {v.status.toUpperCase()}
                                                </span>
                                                {v.amount_paid > 0 && <span className="text-[10px] font-bold text-success">Paid: {formatPkr(v.amount_paid)}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Payment History (Derived from Vouchers) */}
                <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        <h3 className="font-bold">Transaction History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted/10 text-[10px] uppercase tracking-widest text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-3 font-bold">Date</th>
                                    <th className="px-6 py-3 font-bold">Milestone</th>
                                    <th className="px-6 py-3 font-bold text-right">Credit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {client.payment_history.map(h => (
                                    <tr key={h.voucher_id} className="hover:bg-muted/5 transition-colors">
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {h.payment_date && !isNaN(new Date(h.payment_date))
                                                ? new Date(h.payment_date).toLocaleDateString('en-PK')
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold">{PAYMENT_TYPE_LABELS[h.milestone] || h.milestone}</span>
                                                <span className="text-[10px] font-mono opacity-60 uppercase">{h.payment_method} • {h.voucher_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-success text-sm">{formatPkr(h.amount_paid)}</td>
                                    </tr>
                                ))}
                                {client.payment_history.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-muted-foreground italic text-sm">No payments recorded in ledger yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {showVoucherModal && (
                <GenerateVoucherModal
                    initialClientId={clientId}
                    prefill={milestoneToPrefill}
                    onClose={() => {
                        setShowVoucherModal(false);
                        setMilestoneToPrefill(null);
                    }}
                    onSuccess={() => {
                        setShowVoucherModal(false);
                        setMilestoneToPrefill(null);
                        load();
                    }}
                />
            )}
        </div>
    );
}
