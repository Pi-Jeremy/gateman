export interface Event {
    id: string;
    name: string;
    date: string;
    ticket_price: number;
    ticket_limit: number;
    artwork_url: string | null;
    admin_id: string;
    created_at: string;
}

export type UserRole = 'ADMIN' | 'VENDOR';

export interface Profile {
    id: string;
    role: UserRole;
    full_name: string;
    created_at: string;
}

export interface Ticket {
    id: string;
    event_id: string;
    ticket_code: string;
    guest_name: string;
    is_scanned: boolean;
    scanned_at: string | null;
    scanned_by: string | null;
    generated_by_vendor_id: string | null;
    created_at: string;
}

export interface ScanLog {
    id: string;
    event_id: string;
    ticket_code: string;
    staff_id: string;
    status: 'SUCCESS' | 'ALREADY_SCANNED' | 'INVALID_EVENT' | 'NOT_FOUND';
    message: string;
    created_at: string;
}

export interface ValidationResponse {
    success: boolean;
    status: string;
    message: string;
    guest_name?: string;
    scanned_at?: string;
}
