import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type CookieStore = ReturnType<typeof cookies> | Awaited<ReturnType<typeof cookies>>

export function createClient(cookieStore?: CookieStore) {
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
