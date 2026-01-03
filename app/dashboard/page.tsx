'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowRight, Plus, LogOut, Ticket, Settings, Users } from 'lucide-react';
import type { Event, UserRole } from '@/types';

export default function Dashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            setRole(profile.role as UserRole);
            fetchEvents(session.user.id, profile.role as UserRole);
        } else {
            // Fallback for missing profile
            setRole('VENDOR');
            fetchEvents(session.user.id, 'VENDOR');
        }
    };

    const fetchEvents = async (userId: string, userRole: UserRole) => {
        let query = supabase.from('events').select('*');

        if (userRole === 'VENDOR') {
            const { data: assignments } = await supabase
                .from('vendor_assignments')
                .select('event_id')
                .eq('vendor_id', userId);

            const assignedIds = assignments?.map(a => a.event_id) || [];
            if (assignedIds.length === 0) {
                setEvents([]);
                setLoading(false);
                return;
            }
            query = query.in('id', assignedIds);
        }

        const { data, error } = await query.order('date', { ascending: true });

        if (!error && data) {
            setEvents(data);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <main className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Ticket className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white leading-tight">EVENTGATE</h1>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                {role === 'ADMIN' ? 'Admin Controller' : 'Vendor Portal'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {role === 'ADMIN' && (
                            <>
                                <button
                                    onClick={() => router.push('/admin/vendors')}
                                    className="p-3 hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 hover:text-white"
                                    title="Manage Vendors"
                                >
                                    <Users className="w-6 h-6" />
                                </button>
                                <button
                                    className="p-3 hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 hover:text-white"
                                    title="System Settings"
                                >
                                    <Settings className="w-6 h-6" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleLogout}
                            className="p-3 hover:bg-zinc-900 rounded-full transition-colors text-zinc-500 hover:text-white"
                            title="Sign Out"
                        >
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Header Section */}
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-zinc-200 tracking-tight">
                        {role === 'ADMIN' ? 'Event Management' : 'Assigned Events'}
                    </h2>
                    <p className="text-zinc-500 max-w-lg">
                        {role === 'ADMIN'
                            ? 'Configure ticket limits, pricing, and monitor vendor activity across all your active events.'
                            : 'Access assigned scanning gates and monitor live entry statistics for your events.'}
                    </p>
                </div>

                {/* Event Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loading ? (
                        [1, 2].map(i => (
                            <div key={i} className="h-48 bg-zinc-900 rounded-3xl border border-zinc-800 animate-pulse" />
                        ))
                    ) : events.length > 0 ? (
                        events.map(event => (
                            <div
                                key={event.id}
                                className="group relative h-full glass rounded-3xl p-8 transition-all hover:border-primary/50 cursor-pointer overflow-hidden"
                                onClick={() => router.push(`/scanner/${event.id}`)}
                            >
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors blur-2xl" />

                                <div className="relative flex flex-col h-full justify-between space-y-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2 text-primary">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-widest">
                                                    {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            {role === 'ADMIN' && (
                                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded font-black tracking-widest uppercase">
                                                    SHS {event.ticket_price.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors">
                                            {event.name}
                                        </h3>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                            Limit: {event.ticket_limit} TIX
                                        </div>
                                        <div className="flex items-center space-x-2 font-bold text-sm text-zinc-400 group-hover:text-white transition-colors">
                                            <span>{role === 'ADMIN' ? 'Manage' : 'Scan'}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-zinc-800 rounded-3xl">
                            <Calendar className="w-12 h-12 text-zinc-700" />
                            <p className="text-zinc-500 font-medium text-center px-4">
                                {role === 'ADMIN'
                                    ? 'No events scheduled. Create your first event to start generating tickets.'
                                    : 'No events assigned to your portal. Please contact the administrator.'}
                            </p>
                        </div>
                    )}

                    {role === 'ADMIN' && (
                        <div
                            onClick={() => router.push('/admin/events/new')}
                            className="flex items-center justify-center h-48 border-2 border-dashed border-zinc-800 hover:border-primary/50 hover:bg-primary/5 rounded-3xl transition-all cursor-pointer group"
                        >
                            <div className="flex flex-col items-center space-y-2">
                                <div className="p-3 bg-zinc-900 rounded-full group-hover:bg-primary transition-colors">
                                    <Plus className="w-6 h-6 text-zinc-500 group-hover:text-white" />
                                </div>
                                <span className="text-xs font-bold uppercase text-zinc-600 group-hover:text-primary">Schedule New Event</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Global Footer */}
                <div className="pt-8 border-t border-zinc-900 flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase tracking-[2px]">
                    <span>Powered by Supabase Realtime</span>
                    <span className="text-primary/50">Secure Sync Active</span>
                </div>
            </div>
        </main>
    );
}
