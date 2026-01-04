import { createClient } from '@/utils/supabase/server'

export default async function Page() {
    const supabase = await createClient()

    // Note: 'todos' table doesn't exist in your schema. 
    // I'm using 'events' as an example because it exists.
    // Replace 'events' with 'todos' once you create the table.
    const { data: items } = await supabase.from('events').select()

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                    Server-Side Items
                </h1>

                <ul className="grid gap-4">
                    {items?.map((item) => (
                        <li
                            key={item.id}
                            className="p-6 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl hover:border-primary/50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{item.name}</h3>
                                    <p className="text-sm text-zinc-500">
                                        {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
                                    </p>
                                </div>
                                <div className="text-xs font-black text-primary uppercase tracking-widest">
                                    Live Data
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
