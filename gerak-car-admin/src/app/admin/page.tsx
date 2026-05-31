import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import RoleUpdater from './RoleUpdater'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch all users for the User Management tab
  const { data: allUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch active rides from new unified orders table
  const { count: activeRides } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'])

  // Fetch completed revenue from new unified orders table
  const { data: completedRides } = await supabase
    .from('orders')
    .select('price_quoted')
    .eq('status', 'COMPLETED')
  
  const totalRevenue = completedRides?.reduce((sum, r) => sum + Number(r.price_quoted), 0) || 0

  if (!profile?.roles?.includes('admin')) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 max-w-md text-center shadow-xl dark:shadow-[0_0_50px_rgba(255,0,0,0.15)] relative overflow-hidden">
           <h1 className="text-2xl font-extrabold text-black dark:text-white mb-2">Access Denied</h1>
           <p className="text-zinc-500 dark:text-zinc-400 mb-8 font-medium">You do not have administrative privileges to view this portal.</p>
           <form action="/auth/signout" method="post">
              <button className="bg-red-500 hover:bg-red-600 dark:hover:bg-red-400 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg w-full">
                Sign Out
              </button>
           </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex relative overflow-hidden transition-colors duration-300">
      {/* Background glow effects - Removed complex colors for classic look */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-zinc-200/20 dark:bg-zinc-800/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-zinc-200/20 dark:bg-zinc-800/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Desktop Sidebar */}
      <div className="w-72 bg-white dark:bg-black/40 backdrop-blur-3xl border-r border-zinc-200 dark:border-white/10 flex-col hidden md:flex z-10">
        <div className="p-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-zinc-100 dark:bg-black/50 p-2 rounded-xl border border-zinc-200 dark:border-white/10 shadow-md dark:shadow-xl overflow-hidden relative flex-shrink-0">
                <Image src="/logo.png" alt="Gerak Car Logo" fill className="object-cover" />
             </div>
             <span className="text-black dark:text-white font-extrabold text-xl tracking-tight">Gerak Car</span>
          </div>
        </div>
        <nav className="flex-1 px-6 py-4 space-y-3">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-white/10 rounded-xl font-bold shadow-sm">
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
        <div className="p-6 border-t border-zinc-200 dark:border-white/10 flex flex-col gap-4">
           <div>
              <h3 className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider mb-2 pl-2">Appearance</h3>
              <ThemeToggle />
           </div>
           <form action="/auth/signout" method="post">
              <button className="flex w-full items-center justify-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all border border-red-200 dark:border-red-500/20">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 Sign Out
              </button>
           </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col z-10 pb-20 md:pb-0">
        <header className="h-20 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-2xl flex items-center px-6 md:px-10 justify-between sticky top-0 z-20">
           <div className="flex items-center gap-4 md:hidden">
             <div className="w-10 h-10 bg-zinc-100 dark:bg-black/50 p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 shadow-md dark:shadow-xl overflow-hidden relative">
                <Image src="/logo.png" alt="Gerak Car Logo" fill className="object-cover" />
             </div>
           </div>
            <h2 className="text-black dark:text-white font-extrabold text-xl tracking-wide hidden md:block">Dashboard Overview</h2>
           <div className="flex items-center gap-4 ml-auto">
              <span className="text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-4 py-1.5 rounded-full text-xs font-bold border border-zinc-200 dark:border-white/10">Admin</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium hidden sm:block">{user.email}</span>
           </div>
        </header>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {/* Stat Card 1 */}
              <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100 dark:bg-zinc-900 blur-[50px] rounded-full transition-all" />
                 <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-zinc-500 dark:text-zinc-400 font-bold tracking-wide">Total Users</h3>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white border border-zinc-200 dark:border-white/10 shadow-sm">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                 </div>
                 <p className="text-4xl font-extrabold text-black dark:text-white relative z-10">{allUsers?.length || 0}</p>
                 <p className="text-sm text-zinc-500 mt-2 font-medium relative z-10">Registered accounts</p>
              </div>
              
              {/* Stat Card 2 */}
              <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100 dark:bg-zinc-900 blur-[50px] rounded-full transition-all" />
                 <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-zinc-500 dark:text-zinc-400 font-bold tracking-wide">Active Orders</h3>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white border border-zinc-200 dark:border-white/10 shadow-sm">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                 </div>
                 <p className="text-4xl font-extrabold text-black dark:text-white relative z-10">{activeRides || 0}</p>
                 <p className="text-sm text-zinc-500 mt-2 font-medium relative z-10">Happening right now</p>
              </div>
              
              {/* Stat Card 3 */}
              <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-100 dark:bg-zinc-900 blur-[50px] rounded-full transition-all" />
                 <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-zinc-500 dark:text-zinc-400 font-bold tracking-wide">Total Revenue</h3>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white border border-zinc-200 dark:border-white/10 shadow-sm">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                 </div>
                 <p className="text-4xl font-extrabold text-black dark:text-white relative z-10">RM {totalRevenue.toFixed(2)}</p>
                 <p className="text-sm text-zinc-500 mt-2 font-medium relative z-10">All time platform</p>
              </div>
           </div>

           <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
              <h3 className="text-black dark:text-white font-extrabold text-xl mb-8">Recent Activity</h3>
              <div className="text-center py-16 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/5">
                 <div className="w-20 h-20 bg-zinc-200 dark:bg-black/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-zinc-300 dark:border-white/5">
                    <svg className="w-8 h-8 text-zinc-500 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                 </div>
                 <p className="text-zinc-600 dark:text-zinc-400 font-medium text-lg">No activity yet</p>
                 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                   {allUsers?.slice(0, 4).map((u: any) => (
                     <div key={u.id} className="flex items-center gap-4 bg-white dark:bg-black/40 p-4 rounded-2xl border border-zinc-200 dark:border-white/5">
                       <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-black dark:text-white font-bold text-sm border border-zinc-200 dark:border-white/10">
                          {u.email.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <p className="text-black dark:text-white font-bold text-sm leading-tight">{u.email}</p>
                         <p className="text-zinc-500 text-xs mt-1">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                       </div>
                     </div>
                   ))}
                 </div>
                 <p className="text-zinc-500 dark:text-zinc-600 text-sm mt-2">Things will appear here once users join.</p>
              </div>
           </div>

           {/* User Management Section */}
           <div className="bg-white dark:bg-black/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-sm mt-10">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-black dark:text-white font-extrabold text-xl">User Management</h3>
                 <span className="bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-white/10 px-3 py-1 rounded-full text-xs font-bold">
                    {allUsers?.length || 0} Registered
                 </span>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-zinc-200 dark:border-white/10 text-zinc-500 text-xs uppercase tracking-wider">
                          <th className="pb-4 pl-4 font-bold">Email</th>
                          <th className="pb-4 font-bold">Name</th>
                          <th className="pb-4 font-bold">Joined</th>
                          <th className="pb-4 pr-4 font-bold">Role Access</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                       {allUsers?.map((u: any) => (
                          <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group">
                             <td className="py-4 pl-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-xs border border-zinc-300 dark:border-white/10">
                                      {u.email.charAt(0).toUpperCase()}
                                   </div>
                                   <span className="text-black dark:text-white font-medium text-sm">{u.email}</span>
                                </div>
                             </td>
                             <td className="py-4 text-zinc-500 dark:text-zinc-400 text-sm">{u.name || '-'}</td>
                             <td className="py-4 text-zinc-500 text-sm">
                                {new Date(u.created_at).toLocaleDateString()}
                             </td>
                             <td className="py-4 pr-4">
                                <RoleUpdater userId={u.id} currentRoles={u.roles || []} />
                             </td>
                          </tr>
                       ))}
                       
                       {(!allUsers || allUsers.length === 0) && (
                          <tr>
                             <td colSpan={4} className="py-8 text-center text-zinc-500 text-sm">No users found.</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-black/80 backdrop-blur-3xl border-t border-zinc-200 dark:border-white/10 z-50 flex items-center justify-around px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
         <a href="#" className="flex flex-col items-center gap-1 p-2 text-emerald-600 dark:text-emerald-400">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/30">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </div>
            <span className="text-[10px] font-bold">Home</span>
         </a>
         <a href="#" className="flex flex-col items-center gap-1 p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <span className="text-[10px] font-bold">Users</span>
         </a>
         
         {/* Mobile Sign Out Button */}
         <form action="/auth/signout" method="post" className="flex flex-col items-center gap-1 p-2">
            <button className="flex flex-col items-center gap-1 text-red-500 hover:text-red-400 transition-colors">
               <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
               </div>
               <span className="text-[10px] font-bold">Sign Out</span>
            </button>
         </form>
      </div>
    </div>
  )
}
