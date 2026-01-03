'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, Zap, ZapOff } from 'lucide-react';

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    isPaused: boolean;
}

export default function QRScanner({ onScan, isPaused }: QRScannerProps) {
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const qrRef = useRef<Html5Qrcode | null>(null);
    const containerId = "reader";

    useEffect(() => {
        // Dynamically import or just use if available since we are in 'use client'
        const html5QrCode = new Html5Qrcode(containerId);
        qrRef.current = html5QrCode;

        startScanner();

        return () => {
            if (qrRef.current && qrRef.current.isScanning) {
                qrRef.current.stop().catch(err => console.error("Error stopping scanner", err));
            }
        };
    }, []);

    useEffect(() => {
        if (qrRef.current) {
            if (isPaused && qrRef.current.isScanning) {
                qrRef.current.pause();
            } else if (!isPaused && qrRef.current.getState() === Html5QrcodeScannerState.PAUSED) {
                qrRef.current.resume();
            }
        }
    }, [isPaused]);

    const startScanner = async () => {
        try {
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            await qrRef.current?.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    onScan(decodedText);
                },
                (errorMessage) => {
                    // ignore error messages for continuous scanning
                }
            );
            setIsCameraActive(true);
        } catch (err) {
            console.error("Camera access failed", err);
            setIsCameraActive(false);
        }
    };

    const toggleFlash = async () => {
        if (qrRef.current?.isScanning) {
            try {
                const hasFlash = qrRef.current.getRunningTrackCapabilities().torch;
                if (hasFlash) {
                    await qrRef.current.applyVideoConstraints({
                        advanced: [{ torch: !isFlashOn } as any]
                    });
                    setIsFlashOn(!isFlashOn);
                } else {
                    alert("Flash not supported on this camera");
                }
            } catch (e) {
                console.error("Flash toggle error", e);
            }
        }
    };

    return (
        <div className="relative w-full aspect-square max-w-md mx-auto overflow-hidden rounded-3xl border-4 border-zinc-800 bg-zinc-900 shadow-2xl">
            <div id={containerId} className="w-full h-full" />

            {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 z-10">
                    <CameraOff className="w-12 h-12 mb-2" />
                    <p className="text-sm font-medium">Requesting Camera Access...</p>
                </div>
            )}

            {isCameraActive && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-4 z-20">
                    <button
                        onClick={toggleFlash}
                        className={`p-4 rounded-full glass transition-all ${isFlashOn ? 'text-amber-400 border-amber-500/50' : 'text-zinc-400'}`}
                    >
                        {isFlashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
                    </button>
                </div>
            )}

            {/* Industrial Overlay Decoration */}
            <div className="absolute inset-0 border-[20px] border-zinc-950/20 pointer-events-none" />
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg pointer-events-none" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg pointer-events-none" />
        </div>
    );
}
