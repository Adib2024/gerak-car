import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function RootPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from public.users to determine roles
  const { data: profile } = await supabase
    .from('users')
    .select('roles, name')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.roles) {
    // Fallback if roles is not found to prevent infinite login loop
    redirect('/customer')
  }

  const roles = profile.roles as string[]

  // If user only has ONE role, send them straight to that portal (skip selection)
  if (roles.length === 1) {
    redirect(`/${roles[0]}`)
  }

  // If they have MULTIPLE roles, show the Super App Portal Selection UI
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-blue-500/10 blur-[150px] rounded-full" />
      </div>

      <div className="z-10 text-center mb-12">
        <div className="w-24 h-24 bg-white/5 backdrop-blur-xl rounded-3xl p-4 border border-white/10 mx-auto mb-8 shadow-[0_0_50px_rgba(255,255,255,0.05)] relative overflow-hidden">
           <Image src="/logo.png" alt="Gerak Car Logo" fill className="object-cover p-2" />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
          Welcome, {profile.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-zinc-400 font-medium text-lg">Choose your portal to enter</p>
      </div>

      {/* Dynamic Portal Grid based on Array Roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl z-10">
        
        {roles.includes('customer') && (
          <a href="/customer" className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 hover:border-emerald-500/50 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 shadow-xl overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/40 transition-all duration-500" />
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-2xl mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Customer</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Book rides, order food, and request Jubah deliveries across campus.</p>
          </a>
        )}

        {roles.includes('driver') && (
          <a href="/driver" className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 hover:border-blue-500/50 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 shadow-xl overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full group-hover:bg-blue-500/40 transition-all duration-500" />
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 flex items-center justify-center rounded-2xl mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Driver Portal</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Accept rides, track your earnings, and navigate to customer pickups.</p>
          </a>
        )}

        {roles.includes('food_runner') && (
          <a href="/food" className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 hover:border-orange-500/50 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 shadow-xl overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-[50px] rounded-full group-hover:bg-orange-500/40 transition-all duration-500" />
            <div className="w-16 h-16 bg-orange-500/10 text-orange-400 flex items-center justify-center rounded-2xl mb-6 border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Food Runner</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Accept food orders, pick up from restaurants, and deliver to students.</p>
          </a>
        )}

        {roles.includes('jubah_runner') && (
          <a href="/jubah" className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 hover:border-pink-500/50 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 shadow-xl overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 blur-[50px] rounded-full group-hover:bg-pink-500/40 transition-all duration-500" />
            <div className="w-16 h-16 bg-pink-500/10 text-pink-400 flex items-center justify-center rounded-2xl mb-6 border border-pink-500/20 group-hover:scale-110 transition-transform duration-500">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Jubah Runner</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Manage laundry drop-offs, accept Jubah requests, and handle logistics.</p>
          </a>
        )}

        {roles.includes('admin') && (
          <a href="/admin" className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-2xl border border-white/10 hover:border-purple-500/50 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 shadow-xl overflow-hidden cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full group-hover:bg-purple-500/40 transition-all duration-500" />
            <div className="w-16 h-16 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-2xl mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Admin Panel</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Manage users, view platform statistics, and oversee operations.</p>
          </a>
        )}

      </div>
      
      <div className="mt-16 z-10">
        <form action="/auth/signout" method="post">
           <button className="px-6 py-2 rounded-full border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
           </button>
        </form>
      </div>
    </div>
  )
}
