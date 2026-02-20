'use client';
import React, { useState } from 'react';
import { vouchersService } from '../../app/services/vouchersService.js';
import { X, Receipt, Wallet, Calendar, FileText, CheckCircle2 } from 'lucide-react';

const formatPkr = (n) =>
    parseFloat(n || 0).toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

export default function RecordPaymentModal({ voucher, onClose, onSuccess }) {
    const [amount, setAmount] = useState(voucher.balance || voucher.amount);
    const [method, setMethod] = useState('Cash');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (parseFloat(amount) <= 0) {
            setError('Amount must be greater than 0');
            setLoading(false);
            return;
        }

        if (parseFloat(amount) > parseFloat(voucher.balance)) {
            setError(`Amount cannot exceed remaining balance of ${formatPkr(voucher.balance)}`);
            setLoading(false);
            return;
        }

        try {
            await vouchersService.recordPayment(voucher.id, {
                amount_paid: parseFloat(amount),
                payment_method: method,
                payment_date: date,
                notes
            });
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.error || e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 self-center">
                <div className="p-8 pb-4 flex items-center justify-between border-b border-border/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-black text-primary tracking-tight">Financial Entry</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Voucher Summary */}
                    <div className="bg-muted/5 border border-border/30 rounded-3xl p-6  relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                            <Receipt className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Voucher Reference</p>
                                    <h4 className="text-lg font-bold text-primary">{voucher.voucher_number}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Institution</p>
                                    <h4 className="text-sm font-bold truncate max-w-[150px]">{voucher.client_name}</h4>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/10">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Total</p>
                                    <p className="text-xs font-bold text-foreground opacity-60">{formatPkr(voucher.amount)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Received</p>
                                    <p className="text-xs font-bold text-emerald-600">{formatPkr(voucher.amount_paid)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Liability</p>
                                    <p className="text-sm font-black text-destructive">{formatPkr(voucher.balance)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Payment Amount (PKR)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full pl-6 pr-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none text-2xl font-black text-primary placeholder:text-muted-foreground/20"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    max={voucher.balance}
                                    required
                                    autoFocus
                                    placeholder="0.00"
                                />
                                {amount == voucher.balance && (
                                    <CheckCircle2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 animate-in fade-in zoom-in" />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Entry Date
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-5 py-3 bg-muted/5 border border-border/50 rounded-xl font-bold text-sm focus:border-primary/30 outline-none"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Channel</label>
                                <select
                                    className="w-full px-5 py-3 bg-muted/5 border border-border/50 rounded-xl font-bold text-sm focus:border-primary/30 outline-none cursor-pointer"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                >
                                    <option value="Cash">Cash Deposit</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Physical Cheque</option>
                                    <option value="Online">Online Portal</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-1.5">
                                <FileText className="w-3 h-3" /> Descriptive Notes
                            </label>
                            <textarea
                                className="w-full px-5 py-3 bg-muted/5 border border-border/50 rounded-xl font-medium text-sm focus:border-primary/30 outline-none placeholder:text-muted-foreground/30 resize-none"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Received via cheque #12345..."
                                rows={2}
                            />
                        </div>

                        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-xs font-bold border border-destructive/20 animate-shake">{error}</div>}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Secure Ledger'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
