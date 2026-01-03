'use client';

import { Download, Printer, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface Ticket {
    id: string;
    ticket_code: string;
    guest_name: string | null;
}

export default function BatchExport({ eventId, eventName }: { eventId: string, eventName: string }) {
    const [isExporting, setIsExporting] = useState(false);
    const [showPrintView, setShowPrintView] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    const fetchTickets = async () => {
        const { data, error } = await supabase
            .from('tickets')
            .select('id, ticket_code, guest_name')
            .eq('event_id', eventId);

        if (data) setTickets(data);
        return data || [];
    };

    const handleCSVExport = async () => {
        setIsExporting(true);
        const data = await fetchTickets();

        if (data.length === 0) {
            alert("No tickets found for this event.");
            setIsExporting(false);
            return;
        }

        // Add both Google Sheets formula AND base64 image for Excel compatibility
        const headers = ['Ticket ID', 'Secure Code', 'Guest Name', 'QR Code (Google Sheets)', 'QR Code (Base64)'];
        const rows = await Promise.all(
            data.map(async (t) => {
                const qrFormula = `=IMAGE("https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(t.ticket_code)}")`;
                const qrDataUrl = await QRCode.toDataURL(t.ticket_code, { width: 200, margin: 1 });
                return `${t.id},${t.ticket_code},${t.guest_name || ''},"${qrFormula}",${qrDataUrl}`;
            })
        );

        const csvContent = [headers.join(','), ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventName.replace(/\s+/g, '_')}_tickets.csv`;
        a.click();

        setIsExporting(false);
    };

    const preparePrint = async () => {
        setIsExporting(true);
        await fetchTickets();
        setShowPrintView(true);
        setIsExporting(false);
    };

    // Auto-trigger print dialog when print view is shown
    useEffect(() => {
        if (showPrintView && tickets.length > 0) {
            // Add class to body to hide other content during print
            document.body.classList.add('printing-tickets');

            // Longer delay to ensure QR codes are fully rendered
            const timer = setTimeout(() => {
                window.print();
            }, 1500);

            return () => {
                clearTimeout(timer);
                document.body.classList.remove('printing-tickets');
            };
        }
    }, [showPrintView, tickets]);

    if (showPrintView) {
        return (
            <>
                <style jsx global>{`
                    @media screen {
                        .print-container {
                            position: fixed;
                            inset: 0;
                            background: white;
                            z-index: 100;
                            overflow-y: auto;
                            padding: 2rem;
                        }
                    }
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print-container, .print-container * {
                            visibility: visible;
                        }
                        .print-container {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 0;
                        }
                        .print-header {
                            display: none;
                        }
                        .print-grid {
                            display: block;
                            width: 100%;
                        }
                        .print-row {
                            display: flex;
                            justify-content: space-around;
                            page-break-inside: avoid;
                            margin-bottom: 20px;
                        }
                        .print-ticket {
                            width: 30%;
                            border: 2px solid #000;
                            padding: 10px;
                            text-align: center;
                            page-break-inside: avoid;
                        }
                    }
                `}</style>
                <div className="print-container">
                    <div className="print-header flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Printable Ticket Sheet</h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => window.print()}
                                className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"
                            >
                                <Printer className="w-5 h-5" /> Print Now
                            </button>
                            <button
                                onClick={() => setShowPrintView(false)}
                                className="bg-zinc-200 px-6 py-2 rounded-xl font-bold text-black"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    <div className="print-grid">
                        {Array.from({ length: Math.ceil(tickets.length / 3) }).map((_, rowIndex) => (
                            <div key={rowIndex} className="print-row">
                                {tickets.slice(rowIndex * 3, rowIndex * 3 + 3).map(ticket => (
                                    <div key={ticket.id} className="print-ticket">
                                        <QRCodeSVG value={ticket.ticket_code} size={120} level="H" />
                                        <div style={{ marginTop: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                                            {eventName}
                                        </div>
                                        <div style={{ marginTop: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                                            {ticket.ticket_code}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="flex flex-wrap gap-3 mt-4">
            <button
                onClick={handleCSVExport}
                disabled={isExporting}
                className="flex-1 min-w-[140px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-zinc-700/50"
            >
                <FileText className="w-4 h-4" /> Export CSV
            </button>
            <button
                onClick={preparePrint}
                disabled={isExporting}
                className="flex-1 min-w-[140px] bg-primary/10 hover:bg-primary/20 text-primary py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-primary/20"
            >
                <Printer className="w-4 h-4" /> Print Codes
            </button>
        </div>
    );
}
