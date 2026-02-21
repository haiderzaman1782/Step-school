'use client';
import React, { useEffect, useState } from 'react';
import { vouchersService } from '../../app/services/vouchersService.js';
import RecordPaymentModal from './RecordPaymentModal.jsx';
import GenerateVoucherModal from './GenerateVoucherModal.jsx';
import {
    Receipt,
    Search,
    Plus,
    Download,
    ArrowLeft,
    ArrowRight,
    TrendingDown,
    Trash2
} from 'lucide-react';

const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    partial: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200'
};

const PAYMENT_TYPE_LABELS = {
    advance: 'Initial Advance',
    after_pre_registration: 'Post-Registration',
    submitted_examination: 'Exam Submission',
    roll_number_slip: 'Roll Number Slip',
};

const formatPkr = (n) =>
    parseFloat(n || 0).toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 });

export default function SchoolVoucherList({ clientId, isClientView = false }) {
    const [vouchers, setVouchers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [paymentModal, setPaymentModal] = useState(null);
    const [showManualModal, setShowManualModal] = useState(false);
    const [offset, setOffset] = useState(0);
    const LIMIT = 20;

    const load = async (s = search, st = status, off = offset) => {
        setLoading(true);
        setError('');
        try {
            const params = { limit: LIMIT, offset: off };
            if (s) params.search = s;
            if (st) params.status = st;
            if (clientId) params.client_id = clientId;

            const data = await vouchersService.getAll(params);
            setVouchers(data.vouchers);
            setTotal(data.pagination.total);
        } catch (e) {
            setError(e.response?.data?.error || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e) => {
        e.preventDefault();
        setOffset(0);
        load(search, status, 0);
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this voucher?')) return;
        try {
            await vouchersService.cancel(id);
            load();
        } catch (e) {
            alert(e.response?.data?.error || e.message);
        }
    };

    const handleDeleteVoucher = async (id) => {
        if (!confirm('PERMANENT DELETE: Are you sure? This cannot be undone.')) return;
        try {
            await vouchersService.delete(id);
            load();
        } catch (e) {
            alert(e.response?.data?.error || e.message);
        }
    };

    return (
        <div className="voucher-list-container space-y-8 animate-in fade-in duration-700">
            {/* Filters Bar */}
            <div className="bg-card border border-border/50 p-2 rounded-[2rem] shadow-sm flex flex-col items-start gap-5">
                {/* Search input row */}
                <form onSubmit={handleSearch} className="relative w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by voucher # or school name..."
                        className="w-full pl-14 pr-6 py-4 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground/40 font-medium"
                    />
                </form>
                {/* Controls row — wraps on mobile */}
                <div className="flex flex-wrap items-between gap-2 px-1 pb-1">
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setOffset(0); load(search, e.target.value, 0); }}
                        className="bg-muted/50 border-none rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground focus:ring-0 cursor-pointer"
                    >
                        <option value="">All Transactions</option>
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Settled</option>
                    </select>
                    <button
                        type="submit"
                        onClick={handleSearch}
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        Search
                    </button>
                    {!isClientView && (
                        <button
                            onClick={() => setShowManualModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-100 transition-all shadow-sm border border-indigo-100"
                        >
                            <Plus className="w-4 h-4" /> Issue Voucher
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-bold border border-destructive/20">{error}</div>}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest animate-pulse">Syncing Financials...</p>
                </div>
            ) : vouchers.length === 0 ? (
                <div className="bg-card border border-border/50 rounded-[2rem] p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center">
                        <Receipt className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <div>
                        <p className="text-lg font-bold">No records found</p>
                        <p className="text-muted-foreground text-sm">We couldn't find any financial records matching your criteria.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/5 border-b border-border/20">
                                        <th colSpan={2} className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground min-w-[180px]">ID & Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Institution</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Description</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Debit</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right text-success/80">Credit</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right text-destructive">Balance</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">State</th>
                                        {!isClientView && <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pr-10">Options</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {vouchers.map((v) => (
                                        <tr key={v.id} className="group hover:bg-muted/5 transition-colors">
                                            <td colSpan={2} className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground font-mono whitespace-nowrap">{v.voucher_number}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 font-black uppercase">Issued {new Date(v.created_at).toLocaleDateString('en-PK')}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{v.client_name}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 font-black uppercase">{v.client_city}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-medium text-muted-foreground">{PAYMENT_TYPE_LABELS[v.milestone_name] || v.milestone_name}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-bold text-foreground opacity-80">{formatPkr(v.amount)}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-bold text-success">{formatPkr(v.amount_paid)}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className="text-sm font-bold text-destructive">{formatPkr(v.balance)}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[v.status] || 'border-border'}`}>
                                                    {v.status === 'paid' ? 'Settled' : v.status}
                                                </span>
                                            </td>
                                            {!isClientView && (
                                                <td className="px-8 py-5 pr-10">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="p-2 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                                                            title="Download Record"
                                                            onClick={() => vouchersService.downloadPDF(v.id, v.voucher_number)}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>

                                                        {v.status !== 'paid' && v.status !== 'cancelled' && (
                                                            <button
                                                                className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all border border-primary/20"
                                                                onClick={() => setPaymentModal(v)}
                                                            >
                                                                Rec. Pay
                                                            </button>
                                                        )}

                                                        {v.status === 'pending' && (
                                                            <button
                                                                className="p-2 rounded-xl text-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all"
                                                                title="Void Voucher"
                                                                onClick={() => handleCancel(v.id)}
                                                            >
                                                                <TrendingDown className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteVoucher(v.id)}
                                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                                            title="Delete Voucher"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                            {isClientView && (
                                                <td className="px-8 py-5 pr-10">
                                                    <button
                                                        className="p-2 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                                                        title="Download Record"
                                                        onClick={() => vouchersService.downloadPDF(v.id, v.voucher_number)}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-8">
                        <button
                            className="flex items-center px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            disabled={offset === 0}
                            onClick={() => { setOffset((o) => o - LIMIT); load(search, status, offset - LIMIT); }}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Prev
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                Financial Logs {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
                            </span>
                        </div>
                        <button
                            className="flex items-center px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            disabled={offset + LIMIT >= total}
                            onClick={() => { setOffset((o) => o + LIMIT); load(search, status, offset + LIMIT); }}
                        >
                            Next <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </>
            )}

            {paymentModal && (
                <RecordPaymentModal
                    voucher={paymentModal}
                    onClose={() => setPaymentModal(null)}
                    onSuccess={() => { setPaymentModal(null); load(); }}
                />
            )}

            {showManualModal && (
                <GenerateVoucherModal
                    initialClientId={clientId}
                    onClose={() => setShowManualModal(false)}
                    onSuccess={() => { setShowManualModal(false); load(); }}
                />
            )}
        </div>
    );
}
