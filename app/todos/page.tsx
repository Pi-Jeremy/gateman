import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Note: Using 'events' table because 'todos' doesn't exist in your schema.
    // Replace 'events' with 'todos' once you create the table.
    const { data: items } = await supabase.from('events').select()

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                    Server-Side Data
                </h1>

                <ul className="grid gap-4">
                    {items?.map((item) => (
                        <li
                            key={item.id}
                            className="p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl hover:border-primary/50 transition-colors shadow-xl"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {item.name || 'Untitled Item'}
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                        ID: {item.id.substring(0, 8)}
                                    </p>
                                </div>
                                <div className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-[2px]">
                                    Live
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                {(!items || items.length === 0) && (
                    <div className="p-12 border-2 border-dashed border-zinc-800 rounded-3xl text-center text-zinc-600 font-bold uppercase tracking-widest">
                        No items found in database
                    </div>
                )}
            </div>
        </main>
    )
}
