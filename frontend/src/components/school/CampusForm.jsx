'use client';
import React, { useState } from 'react';
import { campusesService } from '../../app/services/campusesService.js';
import { X, Building2, MapPin, Navigation, CheckCircle2 } from 'lucide-react';

export default function CampusForm({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        city: '',
        location: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await campusesService.create(formData);
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to create campus');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-start md:items-center justify-center p-4 pt-6 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-card border border-border shadow-2xl rounded-3xl md:rounded-[3rem] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                <div className="relative p-6 md:p-12">
                    <button
                        onClick={onClose}
                        className="absolute right-8 top-8 p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">New Regional Hub</h2>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Campus Expansion</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Campus Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder="e.g. Islamabad Central"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">City</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    placeholder="e.g. Islamabad"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Physical Location</label>
                            <div className="relative">
                                <Navigation className="absolute left-4 top-4 w-4 h-4 text-muted-foreground/50" />
                                <textarea
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium min-h-[100px] resize-none"
                                    placeholder="Full address or location details..."
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl text-destructive text-xs font-bold animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Register Campus
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
