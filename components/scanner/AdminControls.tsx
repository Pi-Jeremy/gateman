'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Ticket, Users, BarChart3, Loader2, AlertTriangle, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BatchExport from './BatchExport';

interface AdminControlsProps {
    eventId: string;
    eventName: string;
}

export default function AdminControls({ eventId, eventName }: AdminControlsProps) {
    const [batchSize, setBatchSize] = useState('50');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [vendorStats, setVendorStats] = useState<{ name: string, count: number }[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchVendorStats();

        // Subscribe to real-time updates for scan logs
        const channel = supabase
            .channel(`scan_logs_${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'scan_logs',
                    filter: `event_id=eq.${eventId}`
                },
                (payload) => {
                    console.log('Real-time scan detected:', payload);
                    // Refresh stats when a new scan is logged
                    fetchVendorStats();
                }
            )
            .subscribe();

        // Backup: Poll every 5 seconds in case real-time doesn't work
        const pollInterval = setInterval(() => {
            fetchVendorStats();
        }, 5000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [eventId]);

    const fetchVendorStats = async () => {
        const { data: logs, error } = await supabase
            .from('scan_logs')
            .select('staff_id, profiles(full_name)')
            .eq('event_id', eventId)
            .eq('status', 'SUCCESS');

        if (error) {
            console.error('Error fetching vendor stats:', error);
            return;
        }

        if (logs) {
            const stats: Record<string, number> = {};
            const names: Record<string, string> = {};

            logs.forEach((log: any) => {
                stats[log.staff_id] = (stats[log.staff_id] || 0) + 1;
                names[log.staff_id] = log.profiles?.full_name || 'Staff Member';
            });

            const statsArray = Object.keys(stats).map(id => ({
                name: names[id],
                count: stats[id]
            })).sort((a, b) => b.count - a.count); // Sort by count descending

            setVendorStats(statsArray);
            console.log('Updated vendor stats:', statsArray);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        const { data: { session } } = await supabase.auth.getSession();

        try {
            const { data, error } = await supabase.rpc('generate_tickets_batch', {
                p_event_id: eventId,
                p_quantity: parseInt(batchSize),
                p_vendor_id: session?.user.id
            });
            if (error) throw error;
            alert(`Successfully generated ${data} tickets`);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you absolutely sure? This will delete all tickets, logs, and artwork associations for this event.")) return;

        setIsDeleting(true);
        const { error } = await supabase.rpc('delete_event_cascade', {
            p_event_id: eventId
        });

        if (error) {
            alert(error.message);
            setIsDeleting(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="w-full space-y-6 mt-12 pb-20">
            <div className="flex items-center space-x-2 text-primary">
                <BarChart3 className="w-5 h-5" />
                <h2 className="text-sm font-black uppercase tracking-widest">Admin Control Panel</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ticket Generator */}
                <div className="glass p-6 rounded-3xl border border-zinc-800 space-y-4">
                    <div className="flex items-center space-x-3 mb-2">
                        <Ticket className="w-5 h-5 text-zinc-500" />
                        <span className="text-xs font-bold uppercase text-white">Bulk Minting</span>
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="number"
                            value={batchSize}
                            onChange={(e) => setBatchSize(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-white w-24 focus:outline-none focus:border-primary"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex-1 bg-primary text-white text-xs font-black uppercase py-2 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center space-x-2"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Generate Batch</span>}
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-500">Tickets will be randomly hashed and added to inventory.</p>
                </div>

                {/* Local Production Tools */}
                <div className="glass p-6 rounded-3xl border border-zinc-800 space-y-4">
                    <div className="flex items-center space-x-3 mb-2">
                        <Share2 className="w-5 h-5 text-zinc-500" />
                        <span className="text-xs font-bold uppercase text-white">Mass Production</span>
                    </div>

                    <BatchExport eventId={eventId} eventName={eventName} />

                    <p className="text-[10px] text-zinc-500">Generate physical tickets using a printer or export codes for custom software.</p>
                </div>

                {/* Vendor Stats */}
                <div className="glass p-6 rounded-3xl border border-zinc-800 space-y-4">
                    <div className="flex items-center space-x-3 mb-2">
                        <Users className="w-5 h-5 text-zinc-500" />
                        <span className="text-xs font-bold uppercase text-white">Staff Performance</span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {vendorStats.length > 0 ? vendorStats.map((stat, i) => (
                            <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-zinc-400">{stat.name}</span>
                                <span className="text-primary">{stat.count} SCANS</span>
                            </div>
                        )) : (
                            <p className="text-[10px] text-zinc-600 italic">No scans recorded yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 pt-8 border-t border-zinc-900">
                <div className="flex items-center justify-between p-6 bg-destructive/5 border border-destructive/20 rounded-3xl">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-destructive">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-wider">Danger Zone</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Destroy event and all associated metadata</p>
                    </div>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-white p-3 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-destructive/20"
                    >
                        {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
