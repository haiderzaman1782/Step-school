'use client';
import React, { useEffect, useState } from 'react';
import { campusesService } from '../../app/services/campusesService.js';
import { Building2, MapPin, Search, Plus, Trash2 } from 'lucide-react';
import CampusForm from './CampusForm.jsx';

export default function CampusList() {
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const data = await campusesService.getAll();
            setCampuses(data);
        } catch (e) {
            setError('Failed to load campuses');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Permanently delete this campus and all associated isolation rules?')) return;
        try {
            await campusesService.delete(id);
            load();
        } catch (e) {
            alert(e.response?.data?.error || 'Delete failed');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-xs font-black uppercase tracking-widest animate-pulse">Syncing Campus Data...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-primary/20"
                >
                    <Plus className="w-5 h-5" /> Add Campus
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campuses.map((campus) => (
                    <div key={campus.id} className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Building2 className="w-7 h-7 text-indigo-600" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-primary tracking-tight">{campus.name}</h3>
                            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium">{campus.city}</span>
                            </div>
                            <p className="text-xs text-muted-foreground/60 mt-4 leading-relaxed font-medium">
                                {campus.location || 'No location details provided.'}
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border/10 flex items-center justify-between">
                            <div className="px-3 py-1 bg-muted/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Active Hub
                            </div>
                            <button
                                onClick={() => handleDelete(campus.id)}
                                className="p-2 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                title="Delete Campus"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {campuses.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-muted/5 rounded-[2.5rem] border border-dashed border-border">
                        <p className="text-muted-foreground font-medium">No campuses registered in the system yet.</p>
                    </div>
                )}
            </div>

            {showForm && (
                <CampusForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}
