'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Users, Plus, Shield, Mail, Lock, User, Loader2, CheckCircle2 } from 'lucide-react';
import type { Profile, Event } from '@/types';

export default function VendorManagement() {
    const [vendors, setVendors] = useState<Profile[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

    // Register Form State
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newFullName, setNewFullName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerError, setRegisterError] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: vendorData } = await supabase.from('profiles').select('*').eq('role', 'VENDOR');
        const { data: eventData } = await supabase.from('events').select('*');
        if (vendorData) setVendors(vendorData);
        if (eventData) setEvents(eventData);
        setLoading(false);
    };

    const handleAssign = async (vendorId: string, eventId: string) => {
        const { error } = await supabase.from('vendor_assignments').insert({
            vendor_id: vendorId,
            event_id: eventId
        });
        if (error) {
            alert("Already assigned or error: " + error.message);
        } else {
            alert("Vendor assigned successfully");
        }
    };

    const handleRegisterVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRegistering(true);
        setRegisterError(null);

        // Note: Using signUp directly. 
        // In a real production app with Service Role, you'd use admin.auth.createUser
        const { data, error } = await supabase.auth.signUp({
            email: newEmail,
            password: newPassword,
            options: {
                data: {
                    full_name: newFullName,
                    role: 'VENDOR'
                }
            }
        });

        if (error) {
            setRegisterError(error.message);
            setIsRegistering(false);
        } else {
            alert(`Vendor account created for ${newEmail}. They can now login.`);
            setNewEmail('');
            setNewPassword('');
            setNewFullName('');
            setIsRegistering(false);
            fetchData(); // Refresh list
        }
    };

    return (
        <main className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-12">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center space-x-2 text-zinc-500 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Vendor Network</h1>
                        <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Manage staff and entry permissions</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Register & List */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Registration Form */}
                        <div className="glass p-6 rounded-3xl border border-zinc-800 space-y-4">
                            <h3 className="text-sm font-black text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Register Staff
                            </h3>
                            <form onSubmit={handleRegisterVendor} className="space-y-4">
                                <div className="space-y-1">
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <input
                                            required
                                            value={newFullName}
                                            onChange={(e) => setNewFullName(e.target.value)}
                                            placeholder="Full Name"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <input
                                            required
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="Email Address"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <input
                                            required
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Security PIN/Pass"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                                {registerError && (
                                    <p className="text-[10px] text-destructive font-black uppercase text-center">{registerError}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={isRegistering}
                                    className="w-full bg-primary text-white text-[10px] font-black uppercase py-3 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center space-x-2"
                                >
                                    {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Add to Network</span>}
                                </button>
                            </form>
                        </div>

                        {/* Active Vendor List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest ml-1">Staff Roster</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {vendors.map(v => (
                                    <div
                                        key={v.id}
                                        onClick={() => setSelectedVendor(v.id)}
                                        className={`glass p-4 rounded-2xl border transition-all cursor-pointer ${selectedVendor === v.id ? 'border-primary ring-1 ring-primary/50' : 'border-zinc-800 hover:border-zinc-700'}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                                                <Shield className="w-4 h-4 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">{v.full_name || 'Guest User'}</p>
                                                <p className="text-[9px] text-zinc-500 uppercase font-black">{v.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Assignment Panel */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-sm font-black text-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Gate Assignments
                        </h3>
                        {selectedVendor ? (
                            <div className="glass rounded-3xl p-8 border border-zinc-800 h-full">
                                <div className="mb-8">
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Assigning Access for</p>
                                    <h4 className="text-2xl font-black text-white">{vendors.find(v => v.id === selectedVendor)?.full_name}</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {events.map(event => (
                                        <div key={event.id} className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between group hover:border-zinc-600 transition-all">
                                            <div>
                                                <p className="text-sm font-bold text-white">{event.name}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">
                                                    {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleAssign(selectedVendor, event.id)}
                                                className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all"
                                                title="Assign to Event"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-600 bg-zinc-950/20">
                                <Users className="w-16 h-16 mb-4 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select a vendor to manage gate permissions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
