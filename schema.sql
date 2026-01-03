-- EventGate Combined Schema (Core + Admin/Vendor Management)

-- 1. Profiles Table (RBAC)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'VENDOR')),
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ticket_price DECIMAL DEFAULT 0.00,
    ticket_limit INTEGER DEFAULT 1000,
    artwork_url TEXT,
    admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tickets Table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ticket_code TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    is_scanned BOOLEAN DEFAULT FALSE,
    scanned_at TIMESTAMP WITH TIME ZONE,
    scanned_by UUID REFERENCES auth.users(id),
    generated_by_vendor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, ticket_code)
);

-- 4. Scan Logs Table
CREATE TABLE scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ticket_code TEXT NOT NULL,
    staff_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL, -- 'SUCCESS', 'ALREADY_SCANNED', 'INVALID_EVENT', 'NOT_FOUND'
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Vendor Assignments
CREATE TABLE vendor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, event_id)
);

-- 6. Enable Realtime
-- Note: You may need to enable this in the Supabase UI as well
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- 7. Atomic Validation RPC
CREATE OR REPLACE FUNCTION validate_ticket(
    p_event_id UUID,
    p_ticket_code TEXT,
    p_staff_id UUID
) RETURNS JSON AS $$
DECLARE
    v_ticket RECORD;
BEGIN
    -- Select for update to lock the row
    SELECT * INTO v_ticket 
    FROM tickets 
    WHERE event_id = p_event_id AND ticket_code = p_ticket_code
    FOR UPDATE;

    IF v_ticket IS NULL THEN
        INSERT INTO scan_logs (event_id, ticket_code, staff_id, status, message)
        VALUES (p_event_id, p_ticket_code, p_staff_id, 'NOT_FOUND', 'Ticket code not found for this event');
        
        RETURN json_build_object('success', false, 'status', 'NOT_FOUND', 'message', 'Invalid Ticket Code');
    END IF;

    IF v_ticket.is_scanned THEN
        INSERT INTO scan_logs (event_id, ticket_code, staff_id, status, message)
        VALUES (p_event_id, p_ticket_code, p_staff_id, 'ALREADY_SCANNED', 'Ticket already scanned at ' || v_ticket.scanned_at);
        
        RETURN json_build_object(
            'success', false, 
            'status', 'ALREADY_SCANNED', 
            'message', 'Ticket already used',
            'scanned_at', v_ticket.scanned_at,
            'guest_name', v_ticket.guest_name
        );
    ELSE
        UPDATE tickets 
        SET is_scanned = true, 
            scanned_at = NOW(), 
            scanned_by = p_staff_id
        WHERE id = v_ticket.id;

        INSERT INTO scan_logs (event_id, ticket_code, staff_id, status, message)
        VALUES (p_event_id, p_ticket_code, p_staff_id, 'SUCCESS', 'Ticket validated successfully');

        RETURN json_build_object(
            'success', true, 
            'status', 'SUCCESS', 
            'message', 'Valid Ticket',
            'guest_name', v_ticket.guest_name
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Bulk Ticket Generation Function
CREATE OR REPLACE FUNCTION generate_tickets_batch(
    p_event_id UUID,
    p_quantity INTEGER,
    p_vendor_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_current_count INTEGER;
    v_limit INTEGER;
    v_generated INTEGER := 0;
BEGIN
    -- Check limits
    SELECT ticket_limit INTO v_limit FROM events WHERE id = p_event_id;
    SELECT count(*) INTO v_current_count FROM tickets WHERE event_id = p_event_id;

    IF (v_current_count + p_quantity) > v_limit THEN
        RAISE EXCEPTION 'Ticket limit exceeded for this event';
    END IF;

    FOR i IN 1..p_quantity LOOP
        INSERT INTO tickets (event_id, ticket_code, guest_name, generated_by_vendor_id)
        VALUES (
            p_event_id, 
            upper(substring(md5(random()::text) from 1 for 8)), -- Random 8-char code
            'Guest ' || (v_current_count + i),
            p_vendor_id
        );
        v_generated := v_generated + 1;
    END LOOP;

    RETURN v_generated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Cascade Event Deletion
CREATE OR REPLACE FUNCTION delete_event_cascade(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM events WHERE id = p_event_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Profile Sync Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'System Admin'),
    CASE 
      WHEN new.email = 'kololossict@gmail.com' THEN 'ADMIN'
      ELSE 'VENDOR'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
