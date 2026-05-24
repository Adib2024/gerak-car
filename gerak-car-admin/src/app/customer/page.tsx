import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function CustomerDashboard() {
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

  if (profile?.role !== 'customer') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 max-w-md text-center shadow-[0_0_50px_rgba(255,0,0,0.15)] relative overflow-hidden">
           <h1 className="text-2xl font-extrabold text-white mb-2">Access Denied</h1>
           <p className="text-zinc-400 mb-8 font-medium">This portal is restricted to registered customers only.</p>
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
             <h1 className="text-white font-extrabold text-lg leading-tight tracking-wide">Request Ride</h1>
             <p className="text-cyan-400 font-bold text-xs tracking-wider uppercase">Welcome, {profile.name || user.email.split('@')[0]}</p>
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
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full transition-all group-hover:bg-cyan-500/20" />
            <h2 className="text-white font-extrabold text-2xl mb-6 relative z-10">Where to?</h2>
            
            {/* Search Input */}
            <div className="relative mb-4 z-10">
               <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               </div>
               <div className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-medium shadow-inner">
                  UMPSA Gambang Campus
               </div>
            </div>

            <div className="relative mb-6 z-10">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <div className="w-3 h-3 bg-cyan-500 rounded-sm shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
               </div>
               <input 
                  type="text" 
                  placeholder="Enter drop-off location" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-inner relative z-10"
               />
               
               {/* Decorative connecting line */}
               <div className="absolute left-[21px] -top-[1.2rem] w-0.5 h-6 border-l-2 border-dashed border-white/20 z-0"></div>
            </div>
            
            <button className="w-full relative group/btn overflow-hidden bg-white hover:bg-zinc-200 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] text-lg tracking-wide border border-white/20 z-10">
               <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-emerald-400/30 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
               <span className="relative z-10 flex items-center justify-center gap-3">
                  FIND A RIDE
               </span>
            </button>
         </div>

         {/* Map Placeholder */}
         <div className="flex-1 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-center overflow-hidden relative shadow-2xl min-h-[400px]">
            <div className="text-center relative z-10 p-8">
               <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </div>
               <h3 className="text-white font-extrabold text-xl mb-2">Live Map Loading</h3>
               <p className="text-zinc-400 font-medium max-w-sm mx-auto">Interactive Mapbox integration is scheduled for Phase 3. Real-time driver tracking will appear here.</p>
            </div>
         </div>
      </main>
    </div>
  )
}
