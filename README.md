# EventGate - Real-Time Ticket Validation System

A professional, multi-device mobile web app for event staff to scan and validate QR codes in real-time. Built with Next.js and Supabase.

## Features
- **Atomic Validation**: Prevents double-entry using PostgreSQL stored procedures.
- **Real-Time Stats**: Live check-in counts using Supabase Realtime.
- **Industrial UI**: Dark mode, high-contrast feedback for entry gates.
- **Audio/Haptic Feedback**: Immediate sensory confirmation for staff.
- **Multi-Event Support**: Handle multiple events from a single dashboard.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Framer Motion.
- **Backend**: Supabase (PostgreSQL, Auth, Realtime).
- **Scanner**: `html5-qrcode`.

## Setup Instructions

### 1. Supabase Initialization
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** and run the contents of `schema.sql` (found in this repo).
3. Under **Project Settings > API**, copy your `Project URL` and `Anon Key`.
4. Under **SQL Editor**, ensure the `validate_ticket` function is created successfully.

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Local Development
```bash
npm install
npm run dev
```

## Vercel Deployment
1. Push this repository to GitHub.
2. Connect the repository to [Vercel](https://vercel.com).
3. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` Environment Variables.
4. Deploy!

## Database Seeding
To test the system, insert an event and some tickets:
```sql
-- Insert an event
INSERT INTO events (name, date) VALUES ('Tech Conference 2026', '2026-05-20');

-- Insert tickets (replace the event_id with the one generated above)
INSERT INTO tickets (event_id, ticket_code, guest_name) VALUES 
('YOUR_EVENT_ID', 'TC-001', 'John Doe'),
('YOUR_EVENT_ID', 'TC-002', 'Jane Smith');
```
