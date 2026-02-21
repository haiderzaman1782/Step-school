'use client';
import React, { useState, useEffect } from 'react';
import { clientsService } from '../../app/services/clientsService.js';
import { vouchersService } from '../../app/services/vouchersService.js';
import { X, Receipt, Building2, Calendar, CreditCard, ChevronDown, Landmark } from 'lucide-react';

const VOUCHER_TYPES = [
    { value: 'advance', label: 'Initial Advance' },
    { value: 'after_pre_registration', label: 'Post-Registration' },
    { value: 'submitted_examination', label: 'Exam Submission' },
    { value: 'roll_number_slip', label: 'Roll Number Slip' },
];

export default function GenerateVoucherModal({ onClose, onSuccess, initialClientId }) {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingClients, setFetchingClients] = useState(true);
    const [formData, setFormData] = useState({
        client_id: initialClientId || '',
        payment_type: 'advance',
        amount: '',
        due_date: new Date().toISOString().split('T')[0],
        amount_paid: '',
        payment_method: 'Bank Transfer',
        notes: ''
    });

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const data = await clientsService.getAll({ limit: 100 });
            setClients(data.clients);
            setFetchingClients(false);
        } catch (e) {
            console.error('Failed to load clients');
            setFetchingClients(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // In our system, "manual" generation still needs to resolve to a milestone or custom name.
            // For now, we'll send it to the existing generateVoucher or a specialized creating endpoint.
            // Since our backend generateVoucher expects payment_plan_id, we'll need to adapt it.

            await vouchersService.createManual({
                client_id: formData.client_id,
                amount: parseFloat(formData.amount),
                type: formData.payment_type,
                due_date: formData.due_date,
                amount_paid: formData.amount_paid ? parseFloat(formData.amount_paid) : 0,
                payment_method: formData.payment_method,
                notes: formData.notes
            });

            onSuccess();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to generate voucher');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/20 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-card w-full max-w-lg rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 self-center">
                <div className="p-6 md:p-8 md:pb-4 flex items-center justify-between border-b border-border/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-black text-primary tracking-tight">Generate Voucher</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/20 text-muted-foreground transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Target Institution</label>
                        <div className="relative">
                            <select
                                required
                                className="w-full pl-12 pr-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary appearance-none"
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                disabled={fetchingClients || !!initialClientId}
                            >
                                <option value="">Select School...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Voucher Category</label>
                            <div className="relative">
                                <select
                                    className="w-full pl-12 pr-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary appearance-none"
                                    value={formData.payment_type}
                                    onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                                >
                                    {VOUCHER_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Amount (PKR)</label>
                            <input
                                type="number"
                                required
                                className="w-full px-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Due Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                required
                                className="w-full pl-12 pr-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-primary"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            />
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                        </div>
                    </div>

                    {/* Initial Payment Fields */}
                    <div className="pt-6 border-t border-border/10 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Landmark className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700/60">Initial Payment (Optional)</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Amount Paid</label>
                                <input
                                    type="number"
                                    className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-emerald-700 placeholder:text-emerald-900/20"
                                    placeholder="0.00"
                                    value={formData.amount_paid}
                                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Channel</label>
                                <select
                                    className="w-full px-6 py-4 bg-muted/5 border border-border/50 rounded-2xl font-bold text-primary outline-none appearance-none"
                                    value={formData.payment_method}
                                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Reference Notes</label>
                            <input
                                className="w-full px-6 py-4 bg-muted/5 border border-border/50 rounded-2xl font-medium text-primary outline-none"
                                placeholder="Any reference info..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
                            disabled={loading || fetchingClients}
                        >
                            {loading ? 'Processing...' : 'Issue Voucher'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
