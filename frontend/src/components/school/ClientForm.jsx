'use client';
import React, { useState, useEffect } from 'react';
import { clientsService } from '../../app/services/clientsService.js';
import { campusesService } from '../../app/services/campusesService.js';
import { authService } from '../../app/services/authService.js';
import { Plus, Trash2, Save, X, Building2, MapPin, Calculator, ScrollText, Landmark } from 'lucide-react';

const STANDARD_MILESTONES = [
    { payment_type: 'advance', label: 'Initial Advance', ratio: 0.25 },
    { payment_type: 'after_pre_registration', label: 'Post-Registration', ratio: 0.25 },
    { payment_type: 'submitted_examination', label: 'Exam Submission', ratio: 0.25 },
    { payment_type: 'roll_number_slip', label: 'Roll Number Slip', ratio: 0.25 },
];

export default function ClientForm({ onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        director_name: '',
        admin_email: '',
        city: '',
        seat_cost: 30000,
    });
    const [programs, setPrograms] = useState([{ program_name: '', seat_count: 0 }]);
    const [milestones, setMilestones] = useState(
        STANDARD_MILESTONES.map(m => ({ ...m, amount: 0 }))
    );
    const [campuses, setCampuses] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const totalSeats = programs.reduce((sum, p) => sum + (parseInt(p.seat_count) || 0), 0);
    const totalAmount = totalSeats * formData.seat_cost;

    useEffect(() => {
        setMilestones(prev => prev.map(m => ({
            ...m,
            amount: Math.round(totalAmount * m.ratio)
        })));
    }, [totalAmount]);

    useEffect(() => {
        const user = authService.getCurrentUser();
        setCurrentUser(user);

        if (user?.role === 'owner') {
            loadCampuses();
        }
    }, []);

    const loadCampuses = async () => {
        try {
            const data = await campusesService.getAll();
            setCampuses(data);
        } catch (e) {
            console.error('Failed to load campuses');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (totalSeats <= 0) {
            setError('Total seats must be greater than 0');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                programs: programs.filter(p => p.program_name && p.seat_count > 0),
                payment_plan: milestones
            };

            // Explicitly ensure campus_id is there for owners
            if (currentUser?.role === 'owner' && !payload.campus_id) {
                setError('Please select a campus');
                setLoading(false);
                return;
            }

            await clientsService.create(payload);
            onSuccess();
        } catch (e) {
            setError(e.response?.data?.error || e.message);
        } finally {
            setLoading(false);
        }
    };

    const addProgram = () => setPrograms([...programs, { program_name: '', seat_count: 0 }]);
    const removeProgram = (i) => setPrograms(programs.filter((_, idx) => idx !== i));
    const updateProgram = (i, field, val) => {
        const next = [...programs];
        next[i][field] = val;
        setPrograms(next);
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-primary">New Client Registration</h1>
                    <p className="text-muted-foreground mt-1 font-medium">Onboard a new school and establish their financial contract.</p>
                </div>
                <button onClick={onCancel} className="p-3 rounded-2xl bg-muted/20 text-muted-foreground hover:bg-muted/30 transition-all">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info Card */}
                <div className="bg-card border border-border/50 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground/80">Institution Profile</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">School Name</label>
                            <input
                                required
                                className="w-full px-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Step School City Campus"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Director Name</label>
                            <input
                                required
                                className="w-full px-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                value={formData.director_name}
                                onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                                placeholder="Director's Full Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Admin Email (Portal Login)</label>
                            <input
                                required
                                type="email"
                                className="w-full px-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                value={formData.admin_email}
                                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                placeholder="director@school.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Operational City</label>
                            <input
                                required
                                className="w-full px-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                placeholder="e.g. Faisalabad"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Agreed Seat Cost (PKR)</label>
                            <input
                                type="number"
                                required
                                className="w-full px-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-primary"
                                value={formData.seat_cost}
                                onChange={(e) => setFormData({ ...formData, seat_cost: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        {currentUser?.role === 'owner' && (
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Campus Assignment</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full pl-12 pr-6 py-4 bg-muted/5 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none"
                                        value={formData.campus_id || ''}
                                        onChange={(e) => setFormData({ ...formData, campus_id: e.target.value })}
                                    >
                                        <option value="">Select a Campus...</option>
                                        {campuses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} - {c.city}</option>
                                        ))}
                                    </select>
                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Programs Section */}
                <div className="bg-card border border-border/50 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground/80">Program Enrollment</h3>
                        </div>
                        <button type="button" onClick={addProgram} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors">
                            <Plus className="w-4 h-4" /> Add Program
                        </button>
                    </div>

                    <div className="space-y-4">
                        {programs.map((p, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-4 items-end animate-in slide-in-from-left-2 duration-300">
                                <div className="flex-1 space-y-2 w-full">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Program Title</label>
                                    <input
                                        required
                                        className="w-full px-6 py-3 bg-muted/5 border border-border/30 rounded-xl font-medium focus:border-primary/30 outline-none"
                                        value={p.program_name}
                                        onChange={(e) => updateProgram(i, 'program_name', e.target.value)}
                                        placeholder="e.g. Matric Tech"
                                    />
                                </div>
                                <div className="w-full md:w-32 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Seats</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-6 py-3 bg-muted/5 border border-border/30 rounded-xl font-bold text-center focus:border-primary/30 outline-none"
                                        value={p.seat_count}
                                        onChange={(e) => updateProgram(i, 'seat_count', parseInt(e.target.value))}
                                    />
                                </div>
                                {programs.length > 1 && (
                                    <button type="button" onClick={() => removeProgram(i)} className="mb-0.5 p-3 rounded-xl text-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contract Summary */}
                <div className="bg-indigo-900 text-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Calculator className="w-32 h-32" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-8 flex items-center gap-2">
                            <ScrollText className="w-4 h-4" /> Contractual Ledger Preview
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                            {milestones.map((m, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{m.label}</p>
                                    <p className="text-lg font-bold truncate">
                                        {parseFloat(m.amount).toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 })}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-end justify-between border-t border-white/10 pt-8 mt-2">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Total Contract Value</p>
                                <h1 className="text-4xl font-black mt-1">
                                    {totalAmount.toLocaleString('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 })}
                                </h1>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Institutional Capacity</p>
                                <p className="text-2xl font-black mt-1">{totalSeats} <span className="text-sm opacity-50 font-medium tracking-normal uppercase">Seats</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-bold border border-destructive/20 animate-shake">{error}</div>}

                <div className="flex items-center justify-between pt-4 pb-20">
                    <button type="button" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-1" onClick={onCancel}>
                        Discard Registration
                    </button>
                    <button
                        type="submit"
                        className="bg-primary text-primary-foreground px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Verify & Create Contract'}
                    </button>
                </div>
            </form>
        </div>
    );
}
