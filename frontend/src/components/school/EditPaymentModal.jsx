'use client';
import React, { useState } from 'react';
import { vouchersService } from '../../app/services/vouchersService.js';
import { X, Edit3, Calendar, Wallet, FileText, CheckCircle2 } from 'lucide-react';

const PAYMENT_TYPE_LABELS = {
    advance: 'Initial Advance',
    after_pre_registration: 'Post-Registration',
    submitted_examination: 'Exam Submission',
    roll_number_slip: 'Roll Number Slip',
};

const formatPkr = (n) =>
    parseFloat(n || 0).toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

export default function EditPaymentModal({ payment, onClose, onSuccess }) {
    const [amount, setAmount] = useState(payment.amount_paid);
    const [method, setMethod] = useState(payment.payment_method || 'Cash');
    const [date, setDate] = useState(payment.payment_date?.split('T')[0] || '');
    const [notes, setNotes] = useState(payment.notes || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Using vouchersService to edit a specific payment entry if available, 
            // otherwise using a generic edit service
            // Note: In our simplified v3, we usually record a new payment. 
            // If this is for editing an existing ledger entry:
            await vouchersService.editPayment(payment.id, {
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
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <Edit3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-black text-primary tracking-tight">Modify Transaction</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Payment Amount (PKR)</label>
                            <input
                                type="number"
                                className="w-full px-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none text-2xl font-black text-primary placeholder:text-muted-foreground/20"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Transaction Date
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
                                <FileText className="w-3 h-3" /> Entry Description
                            </label>
                            <textarea
                                className="w-full px-5 py-3 bg-muted/5 border border-border/50 rounded-xl font-medium text-sm focus:border-primary/30 outline-none placeholder:text-muted-foreground/30 resize-none"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Refined notes for this transaction..."
                                rows={3}
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
                                Discard Changes
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Update Transaction'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
