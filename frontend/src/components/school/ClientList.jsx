'use client';
import React, { useEffect, useState } from 'react';
import { clientsService } from '../../app/services/clientsService.js';
import ClientRow from './ClientRow.jsx';
import { Users, Search, Plus, Sparkles, Trash2 } from 'lucide-react';

export default function ClientList({ onAdd, onSelect }) {
    const [clients, setClients] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [offset, setOffset] = useState(0);
    const LIMIT = 10;

    const load = async (s = search, off = offset) => {
        setLoading(true);
        setError('');
        try {
            const data = await clientsService.getAll({ search: s, limit: LIMIT, offset: off });
            setClients(data.clients);
            setTotal(data.pagination.total);
        } catch (e) {
            setError(e.response?.data?.error || e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async (id) => {
        if (!confirm('PERMANENT DELETE: Are you sure you want to remove this school and all its records?')) return;
        try {
            await clientsService.delete(id);
            load();
        } catch (e) {
            alert(e.response?.data?.error || 'Delete failed');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setOffset(0);
        load(search, 0);
    };

    return (
        <div className="client-list-container space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="title-group">
                    <h1 className="text-4xl font-extrabold tracking-tight text-primary">School Clients</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Manage institutional accounts and fee structures across all campuses.</p>
                </div>
                <button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-bold flex items-center transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    onClick={onAdd}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    <span>Register New School</span>
                </button>
            </div>

            <div className="bg-card border border-border/50 p-2 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-center gap-2">
                <form onSubmit={handleSearch} className="relative flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by school name, director, or city..."
                        className="w-full pl-14 pr-6 py-4 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground/40 font-medium"
                    />
                </form>
                <button type="submit" className="w-full md:w-auto px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 transition-colors">
                    Search
                </button>
            </div>

            {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-bold border border-destructive/20">{error}</div>}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
                </div>
            ) : (
                <>
                    <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/5 border-b border-border/50">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">School Profile</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Location</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Capacity</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Value</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right pr-12">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {clients.map((c) => (
                                        <ClientRow
                                            key={c.id}
                                            client={c}
                                            onSelect={() => onSelect(c.id)}
                                            onDelete={() => handleDelete(c.id)}
                                        />
                                    ))}
                                    {clients.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 rounded-3xl bg-muted/20 flex items-center justify-center">
                                                        <Users className="w-8 h-8 text-muted-foreground/30" />
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-bold text-foreground">No schools found</p>
                                                        <p className="text-muted-foreground text-sm">We couldn't find any results matching "{search}"</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-8">
                        <button
                            className="flex items-center px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            disabled={offset === 0}
                            onClick={() => { setOffset(o => o - LIMIT); load(search, offset - LIMIT); }}
                        >
                            ← Previous Page
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-subtle"></div>
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                Registry {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
                            </span>
                        </div>
                        <button
                            className="flex items-center px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            disabled={offset + LIMIT >= total}
                            onClick={() => { setOffset(o => o + LIMIT); load(search, offset + LIMIT); }}
                        >
                            Next Page →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
