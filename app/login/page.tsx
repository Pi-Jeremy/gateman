'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Ticket, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Attempt login
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // Special logic for the default admin account initialization
        if (signInError && email === 'kololossict@gmail.com' && password === 'password') {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: 'System Admin',
                    },
                },
            });

            if (!signUpError) {
                alert("Default Admin account initialized! You can now log in.");
                setLoading(false);
                return;
            }
        }

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <main className="min-h-screen bg-background bg-industrial flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40">
                            <Ticket className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter">STAFF LOGIN</h1>
                        <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mt-2">Portal Access</p>
                    </div>
                </div>

                <div className="glass p-8 rounded-[2rem] border border-zinc-800 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="name@event.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest">Security Pin</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-destructive text-sm font-bold text-center bg-destructive/10 py-3 rounded-xl border border-destructive/20">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>AUTHENTICATE</span>
                                    <Ticket className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    Secure Tunnel v2.4.3 | Entry Management Systems
                </p>
            </div>
        </main>
    );
}
