import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DriverDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'driver') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md text-center shadow-2xl">
           <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
           <p className="text-zinc-400 mb-6">This portal is restricted to registered drivers only.</p>
           <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium px-6 py-2 rounded-xl transition-colors inline-block">
             Return Home
           </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative">
      {/* Header */}
      <header className="h-20 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-lg">GC</span>
           </div>
           <div>
             <h1 className="text-white font-semibold text-lg leading-tight">Driver Portal</h1>
             <p className="text-zinc-400 text-sm">{profile.name}</p>
           </div>
        </div>
        
        <form action="/auth/signout" method="post">
           <button className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           </button>
        </form>
      </header>

      {/* Main Map Content */}
      <main className="flex-1 relative flex flex-col items-center justify-center bg-zinc-900">
         <div className="text-center z-10 p-6">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-zinc-700">
               <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Mapbox Pending</h2>
            <p className="text-zinc-400 max-w-sm mx-auto mb-8">The interactive driver map will be placed here in Phase 3.</p>
            
            <button className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold text-lg px-12 py-4 rounded-full shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] transition-all hover:scale-105 transform">
               GO ONLINE
            </button>
         </div>
      </main>
    </div>
  )
}
