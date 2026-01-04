import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient(cookieStore?: any) {
    // Use provided cookieStore or fall back to next/headers cookies()
    // Note: in Next.js 15+, cookies() returns a Promise.
    const actualCookies = cookieStore || cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                async getAll() {
                    const c = await actualCookies
                    return c.getAll()
                },
                async setAll(cookiesToSet) {
                    try {
                        const c = await actualCookies
                        cookiesToSet.forEach(({ name, value, options }) =>
                            c.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
