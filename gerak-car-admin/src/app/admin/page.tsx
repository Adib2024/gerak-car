import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md text-center shadow-2xl">
           <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
           <p className="text-zinc-400 mb-6">You do not have administrative privileges to view this portal.</p>
           <form action="/auth/signout" method="post">
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-2 rounded-xl transition-colors">
                Sign Out
              </button>
           </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-sm font-bold text-white">GC</span>
             </div>
             <span className="text-white font-bold text-lg tracking-wide">Gerak Car</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl font-medium">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
             Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             Users
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
             Rides
          </a>
        </nav>
        <div className="p-4 border-t border-zinc-800">
           <form action="/auth/signout" method="post">
              <button className="flex w-full items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl font-medium transition-colors">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 Sign Out
              </button>
           </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center px-8 justify-between sticky top-0 z-10">
           <h2 className="text-white font-semibold tracking-wide">Overview</h2>
           <div className="flex items-center gap-4">
              <span className="text-zinc-400 text-sm">{user.email}</span>
           </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-400 font-medium">Total Users</h3>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                 </div>
                 <p className="text-3xl font-bold text-white">0</p>
                 <p className="text-sm text-zinc-500 mt-2">Currently registered</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-400 font-medium">Active Rides</h3>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                 </div>
                 <p className="text-3xl font-bold text-white">0</p>
                 <p className="text-sm text-zinc-500 mt-2">Happening right now</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-400 font-medium">Total Revenue</h3>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                 </div>
                 <p className="text-3xl font-bold text-white">RM 0.00</p>
                 <p className="text-sm text-zinc-500 mt-2">All time platform</p>
              </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-medium mb-6">Recent Activity</h3>
              <div className="text-center py-12 text-zinc-500">
                 <svg className="w-12 h-12 mx-auto mb-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 <p>No activity yet. Things will appear here once users join.</p>
              </div>
           </div>
        </main>
      </div>
    </div>
  )
}
