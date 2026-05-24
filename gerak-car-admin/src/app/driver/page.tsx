import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

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
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 max-w-md text-center shadow-[0_0_50px_rgba(255,0,0,0.15)] relative overflow-hidden">
           <h1 className="text-2xl font-extrabold text-white mb-2">Access Denied</h1>
           <p className="text-zinc-400 mb-8 font-medium">This portal is restricted to registered drivers only.</p>
           <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg w-full block">
             Return Home
           </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="h-20 bg-black/40 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-black/50 p-1.5 rounded-lg border border-white/10 shadow-xl overflow-hidden relative">
              <Image src="/logo.png" alt="Gerak Car Logo" fill className="object-cover" />
           </div>
           <div>
             <h1 className="text-white font-extrabold text-lg leading-tight tracking-wide">Driver Portal</h1>
             <p className="text-emerald-400 font-bold text-xs tracking-wider uppercase">Logged in as {profile.name || user.email?.split('@')[0] || 'Driver'}</p>
           </div>
        </div>
        <form action="/auth/signout" method="post">
           <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-inner">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           </button>
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 z-10 max-w-lg mx-auto w-full">
         <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 mb-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full transition-all group-hover:bg-emerald-500/20" />
            <h2 className="text-white font-extrabold text-2xl mb-2 relative z-10">Status: <span className="text-zinc-500">Offline</span></h2>
            <p className="text-zinc-400 font-medium mb-8 relative z-10">You are not receiving ride requests.</p>
            
            {/* Massive Go Online Button */}
            <button className="w-full relative group overflow-hidden bg-white hover:bg-zinc-200 text-black font-extrabold py-5 px-6 rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] text-lg tracking-wide border border-white/20">
               <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
               <span className="relative z-10 flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  GO ONLINE
               </span>
            </button>
         </div>

         {/* Map Placeholder */}
         <div className="flex-1 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden relative shadow-2xl min-h-[400px]">
            <div className="text-center relative z-10 p-8">
               <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
               </div>
               <h3 className="text-white font-extrabold text-xl mb-2">Live Map Loading</h3>
               <p className="text-zinc-400 font-medium max-w-sm mx-auto">Interactive Mapbox integration is scheduled for Phase 3. Driver tracking will appear here.</p>
            </div>
         </div>
      </main>
    </div>
  )
}
