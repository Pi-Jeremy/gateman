'use client';

import { useState, useCallback, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '@/components/scanner/QRScanner';
import ScanFeedback from '@/components/scanner/ScanFeedback';
import LiveStats from '@/components/dashboard/LiveStats';
import AdminControls from '@/components/scanner/AdminControls';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Search, User as UserIcon, Shield } from 'lucide-react';
import type { ValidationResponse, Event, UserRole } from '@/types';

export default function ScannerPage({ params }: { params: Promise<{ event_id: string }> }) {
    const { event_id } = use(params);
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [feedback, setFeedback] = useState<{
        status: 'SUCCESS' | 'ALREADY_SCANNED' | 'NOT_FOUND' | null;
        message: string;
        guestName?: string;
    }>({ status: null, message: '' });
    const [manualCode, setManualCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, [event_id]);

    const fetchInitialData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }

        // Fetch Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile) setRole(profile.role as UserRole);

        // Fetch Event details for artwork
        const { data: eventData } = await supabase
            .from('events')
            .select('*')
            .eq('id', event_id)
            .single();

        if (eventData) setEvent(eventData);
    };

    const handleScan = useCallback(async (ticketCode: string) => {
        if (isProcessing || feedback.status) return;

        setIsProcessing(true);
        const { data: { session } } = await supabase.auth.getSession();
        const staffId = session?.user.id || '00000000-0000-0000-0000-000000000000';

        try {
            const { data, error } = await supabase.rpc('validate_ticket', {
                p_event_id: event_id,
                p_ticket_code: ticketCode,
                p_staff_id: staffId
            });

            if (error) throw error;

            const result = data as ValidationResponse;
            setFeedback({
                status: result.status as any,
                message: result.message,
                guestName: result.guest_name
            });
        } catch (err) {
            console.error("Validation error", err);
            setFeedback({
                status: 'NOT_FOUND',
                message: 'Network Error'
            });
        } finally {
            setIsProcessing(false);
        }
    }, [event_id, isProcessing, feedback.status]);

    const handleManualCheckin = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode) {
            handleScan(manualCode);
            setManualCode('');
        }
    };

    return (
        <main className="min-h-screen bg-background relative overflow-x-hidden">
            {/* Background Artwork */}
            {event?.artwork_url && (
                <div
                    className="fixed inset-0 z-0 opacity-20 blur-xl scale-110 pointer-events-none"
                    style={{
                        backgroundImage: `url(${event.artwork_url.startsWith('http') ? event.artwork_url : `/artwork/${event.artwork_url}`})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
            )}

            <div className="relative z-10 p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-md flex flex-col space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-zinc-400" />
                        </button>
                        <div className="text-center">
                            <h1 className="text-lg font-black uppercase tracking-widest text-white">
                                {event?.name || 'Loading Gate...'}
                            </h1>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">
                                {role === 'ADMIN' ? 'Admin Access' : 'Scanning Guard'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            {role === 'ADMIN' ? <Shield className="w-5 h-5 text-primary" /> : <UserIcon className="w-5 h-5 text-zinc-400" />}
                        </div>
                    </div>

                    {/* Stats */}
                    <LiveStats eventId={event_id} />

                    {/* Scanner */}
                    <QRScanner onScan={handleScan} isPaused={!!feedback.status || isProcessing} />

                    {/* Manual Input */}
                    <form onSubmit={handleManualCheckin} className="relative group">
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="Enter Code or Guest Name..."
                            className="w-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                    </form>

                    {/* Admin Sections */}
                    {role === 'ADMIN' && (
                        <AdminControls eventId={event_id} eventName={event?.name || 'Unknown Event'} />
                    )}

                    {/* System Info */}
                    <div className="text-center p-4">
                        <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[3px]">
                            Secure Gate Protocol v2.4 | {event_id.substring(0, 8)}
                        </p>
                    </div>
                </div>
            </div>

            <ScanFeedback
                status={feedback.status}
                message={feedback.message}
                guestName={feedback.guestName}
                onClose={() => setFeedback({ status: null, message: '' })}
            />
        </main>
    );
}
