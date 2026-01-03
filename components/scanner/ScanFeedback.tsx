'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { playSuccess, playError, triggerHaptic } from '@/lib/audio';

interface ScanFeedbackProps {
    status: 'SUCCESS' | 'ALREADY_SCANNED' | 'NOT_FOUND' | null;
    message: string;
    guestName?: string;
    onClose: () => void;
}

export default function ScanFeedback({ status, message, guestName, onClose }: ScanFeedbackProps) {
    useEffect(() => {
        if (status === 'SUCCESS') {
            playSuccess();
            triggerHaptic(true);
        } else if (status) {
            playError();
            triggerHaptic(false);
        }

        if (status) {
            const timer = setTimeout(onClose, 1500); // Reduced from 3000ms
            return () => clearTimeout(timer);
        }
    }, [status, onClose]);

    return (
        <AnimatePresence>
            {status && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center ${status === 'SUCCESS' ? 'bg-success/90' : 'bg-destructive/90'
                        }`}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        className="flex flex-col items-center max-w-md w-full glass rounded-3xl p-8 shadow-2xl space-y-4"
                    >
                        {status === 'SUCCESS' ? (
                            <CheckCircle2 className="w-24 h-24 text-white animate-pulse" />
                        ) : status === 'ALREADY_SCANNED' ? (
                            <AlertCircle className="w-24 h-24 text-white" />
                        ) : (
                            <XCircle className="w-24 h-24 text-white" />
                        )}

                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                            {status === 'SUCCESS' ? 'Valid Entry' : 'Void Scan'}
                        </h2>

                        <p className="text-xl font-medium text-white/90">
                            {message}
                        </p>

                        {guestName && (
                            <div className="mt-4 pt-4 border-t border-white/20 w-full">
                                <p className="text-sm uppercase tracking-widest text-white/60 mb-1">Guest Name</p>
                                <p className="text-2xl font-bold text-white">{guestName}</p>
                            </div>
                        )}

                        <p className="text-sm text-white/50 mt-8">
                            Auto-continuing in 1s...
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
