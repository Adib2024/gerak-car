import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 max-w-md text-center shadow-[0_0_50px_rgba(255,0,0,0.15)] relative overflow-hidden">
           <h1 className="text-2xl font-extrabold text-white mb-2">Access Denied</h1>
           <p className="text-zinc-400 mb-8 font-medium">You do not have administrative privileges to view this portal.</p>
           <form action="/auth/signout" method="post">
              <button className="bg-red-500 hover:bg-red-400 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg w-full">
                Sign Out
              </button>
           </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Desktop Sidebar */}
      <div className="w-72 bg-black/40 backdrop-blur-3xl border-r border-white/10 flex-col hidden md:flex z-10">
        <div className="p-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-black/50 p-2 rounded-xl border border-white/10 shadow-xl overflow-hidden relative flex-shrink-0">
                <Image src="/logo.png" alt="Gerak Car Logo" fill className="object-cover" />
             </div>
             <span className="text-white font-extrabold text-xl tracking-tight">Gerak Car</span>
          </div>
        </div>
        <nav className="flex-1 px-6 py-4 space-y-3">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold shadow-inner">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
             Overview
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             Users
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl font-bold transition-all">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
             Rides
          </a>
        </nav>
        <div className="p-6 border-t border-white/10">
           <form action="/auth/signout" method="post">
              <button className="flex w-full items-center justify-center gap-3 px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all border border-red-500/20">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 Sign Out
              </button>
           </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col z-10 pb-20 md:pb-0">
        <header className="h-20 border-b border-white/10 bg-black/40 backdrop-blur-2xl flex items-center px-6 md:px-10 justify-between sticky top-0 z-20">
           <div className="flex items-center gap-4 md:hidden">
             <div className="w-10 h-10 bg-black/50 p-1.5 rounded-lg border border-white/10 shadow-xl overflow-hidden relative">
                <Image src="/logo.png" alt="Gerak Car Logo" fill className="object-cover" />
             </div>
           </div>
           <h2 className="text-white font-extrabold text-xl tracking-wide hidden md:block">Dashboard Overview</h2>
           <div className="flex items-center gap-4 ml-auto">
              <span className="text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-500/20">Admin</span>
              <span className="text-zinc-400 text-sm font-medium hidden sm:block">{user.email}</span>
           </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {/* Stat Card 1 */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full group-hover:bg-blue-500/20 transition-all" />
                 <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-zinc-400 font-bold tracking-wide">Total Users</h3>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                 </div>
                 <p className="text-4xl font-extrabold text-white relative z-10">0</p>
                 <p className="text-sm text-zinc-500 mt-2 font-medium relative z-10">Registered accounts</p>
              </div>
              
              {/* Stat Card 2 */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full group-hover:bg-emerald-500/20 transition-all" />
                 <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-zinc-400 font-bold tracking-wide">Active Rides</h3>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                 </div>
                 <p className="text-4xl font-extrabold text-white relative z-10">0</p>
                 <p className="text-sm text-zinc-500 mt-2 font-medium relative z-10">Happening right now</p>
              </div>
              
              {/* Stat Card 3 */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full group-hover:bg-purple-500/20 transition-all" />
                 <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-zinc-400 font-bold tracking-wide">Total Revenue</h3>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-inner">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                 </div>
                 <p className="text-4xl font-extrabold text-white relative z-10">RM 0.00</p>
                 <p className="text-sm text-zinc-500 mt-2 font-medium relative z-10">All time platform</p>
              </div>
           </div>

           <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-white font-extrabold text-xl mb-8">Recent Activity</h3>
              <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
                 <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/5">
                    <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 </div>
                 <p className="text-zinc-400 font-medium text-lg">No activity yet</p>
                 <p className="text-zinc-600 text-sm mt-2">Things will appear here once users join.</p>
              </div>
           </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-3xl border-t border-white/10 z-50 flex items-center justify-around px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         <a href="#" className="flex flex-col items-center gap-1 p-2 text-emerald-400">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </div>
            <span className="text-[10px] font-bold">Home</span>
         </a>
         <a href="#" className="flex flex-col items-center gap-1 p-2 text-zinc-500 hover:text-white transition-colors">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <span className="text-[10px] font-bold">Users</span>
         </a>
         
         {/* Mobile Sign Out Button */}
         <form action="/auth/signout" method="post" className="flex flex-col items-center gap-1 p-2">
            <button className="flex flex-col items-center gap-1 text-red-500 hover:text-red-400 transition-colors">
               <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
               </div>
               <span className="text-[10px] font-bold">Sign Out</span>
            </button>
         </form>
      </div>
    </div>
  )
}
