'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle, Clock } from 'lucide-react';

interface StatsProps {
    eventId: string;
}

export default function LiveStats({ eventId }: StatsProps) {
    const [total, setTotal] = useState(0);
    const [scanned, setScanned] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        // Subscribe to changes in tickets table for this event
        const channel = supabase
            .channel(`tickets-stats-${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tickets',
                    filter: `event_id=eq.${eventId}`,
                },
                () => {
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);

    const fetchStats = async () => {
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('is_scanned')
            .eq('event_id', eventId);

        if (!error && tickets) {
            setTotal(tickets.length);
            setScanned(tickets.filter(t => t.is_scanned).length);
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="grid grid-cols-2 gap-4 animate-pulse">
            <div className="h-24 bg-zinc-900 rounded-2xl border border-zinc-800" />
            <div className="h-24 bg-zinc-900 rounded-2xl border border-zinc-800" />
        </div>
    );

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="glass p-4 rounded-2xl space-y-1">
                <div className="flex items-center text-zinc-500 space-x-2">
                    <Users className="w-4 h-4" />
                    <span className="text-xs uppercase font-bold tracking-wider">Attendance</span>
                </div>
                <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-white">{scanned}</span>
                    <span className="text-zinc-500 font-medium">/ {total}</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${(scanned / (total || 1)) * 100}%` }}
                    />
                </div>
            </div>

            <div className="glass p-4 rounded-2xl space-y-1">
                <div className="flex items-center text-zinc-500 space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs uppercase font-bold tracking-wider">Remaining</span>
                </div>
                <div className="text-3xl font-black text-white">
                    {total - scanned}
                </div>
                <p className="text-[10px] text-zinc-500 uppercase font-medium">Inside the venue</p>
            </div>
        </div>
    );
}
