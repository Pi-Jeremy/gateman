'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Calendar, DollarSign, Image as ImageIcon, Ticket, Loader2, Plus } from 'lucide-react';

export default function NewEventPage() {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [price, setPrice] = useState('0.00');
    const [limit, setLimit] = useState('1000');
    const [artworkUrl, setArtworkUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();

        const { error } = await supabase.from('events').insert({
            name,
            date: new Date(date).toISOString(),
            ticket_price: parseFloat(price),
            ticket_limit: parseInt(limit),
            artwork_url: artworkUrl || null,
            admin_id: session?.user.id
        });

        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <main className="min-h-screen bg-background p-6 md:p-12 flex items-center justify-center">
            <div className="w-full max-w-2xl space-y-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-zinc-500 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Cancel / Back</span>
                </button>

                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-white tracking-tighter">SCHEDULE EVENT</h1>
                    <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">Configure event parameters</p>
                </div>

                <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 md:p-12 border border-zinc-800 shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Event Name */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Event Name</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-primary transition-all"
                                placeholder="High Octane Tech Conf"
                            />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Launch Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input
                                    required
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Ticket Cost (SHS)</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-600">SHS</span>
                                <input
                                    required
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-16 pr-6 text-white focus:outline-none focus:border-primary transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Ticket Limit */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Inventory Limit</label>
                            <div className="relative">
                                <Ticket className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input
                                    required
                                    type="number"
                                    value={limit}
                                    onChange={(e) => setLimit(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:border-primary transition-all"
                                    placeholder="1000"
                                />
                            </div>
                        </div>

                        {/* Artwork URL */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Artwork Filename (in /artwork/)</label>
                            <div className="relative">
                                <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input
                                    value={artworkUrl}
                                    onChange={(e) => setArtworkUrl(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:border-primary transition-all"
                                    placeholder="event_poster.jpg"
                                />
                            </div>
                            <p className="text-[9px] text-zinc-600 ml-4 uppercase font-bold">Image must be placed in public/artwork folder</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center space-x-2 shadow-2xl shadow-primary/20"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <span>INITIALIZE EVENT</span>
                                <Plus className="w-6 h-6" />
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-zinc-600 text-[10px] font-bold uppercase tracking-[4px]">
                    Authorized Operations Only | v2.4.1
                </p>
            </div>
        </main>
    );
}
