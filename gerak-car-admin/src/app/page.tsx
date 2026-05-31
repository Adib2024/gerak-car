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
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('roles, name')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.roles) {
    // Fallback if roles is not found: return an error screen instead of redirecting
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-white text-3xl font-bold mb-4">Account Setup Incomplete</h1>
        <p className="text-zinc-400 mb-8 max-w-md">We couldn't find your user profile. This usually happens if there was an issue during registration. Please contact support or try registering again.</p>
        
        {profileError && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-xl mb-8 max-w-md text-left text-sm overflow-auto">
             <p className="font-bold mb-1">Database Error:</p>
             <code>{JSON.stringify(profileError, null, 2)}</code>
          </div>
        )}

        <form action="/auth/signout" method="post">
           <button className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-500 transition-colors">Sign Out</button>
        </form>
      </div>
    )
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
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-zinc-800/20 blur-[150px] rounded-full" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-zinc-800/20 blur-[150px] rounded-full" />
      </div>

      <div className="z-10 text-center mb-12">
        <div className="w-20 h-20 bg-white rounded-2xl p-4 border border-zinc-200 mx-auto mb-8 shadow-sm relative overflow-hidden">
           <Image src="/logo.png" alt="Gerak Car Logo" fill className="object-cover p-2" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          Welcome, {profile.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-zinc-400 font-medium text-lg">Choose your portal to enter</p>
      </div>

      {/* Dynamic Portal Grid based on Array Roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl z-10">
        
        {roles.includes('customer') && (
          <a href="/customer" className="group relative bg-zinc-900/50 hover:bg-zinc-800/80 backdrop-blur-2xl border border-zinc-800 hover:border-zinc-500 rounded-2xl p-8 transition-all duration-300 shadow-lg overflow-hidden cursor-pointer">
            <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-xl mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Customer</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Book rides, order food, and request Jubah deliveries across campus.</p>
          </a>
        )}

        {roles.includes('driver') && (
          <a href="/driver" className="group relative bg-zinc-900/50 hover:bg-zinc-800/80 backdrop-blur-2xl border border-zinc-800 hover:border-zinc-500 rounded-2xl p-8 transition-all duration-300 shadow-lg overflow-hidden cursor-pointer">
            <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-xl mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Driver Portal</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Accept rides, track your earnings, and navigate to customer pickups.</p>
          </a>
        )}

        {roles.includes('food_runner') && (
          <a href="/food" className="group relative bg-zinc-900/50 hover:bg-zinc-800/80 backdrop-blur-2xl border border-zinc-800 hover:border-zinc-500 rounded-2xl p-8 transition-all duration-300 shadow-lg overflow-hidden cursor-pointer">
            <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-xl mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Food Runner</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Accept food orders, pick up from restaurants, and deliver to students.</p>
          </a>
        )}

        {roles.includes('jubah_runner') && (
          <a href="/jubah" className="group relative bg-zinc-900/50 hover:bg-zinc-800/80 backdrop-blur-2xl border border-zinc-800 hover:border-zinc-500 rounded-2xl p-8 transition-all duration-300 shadow-lg overflow-hidden cursor-pointer">
            <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-xl mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Jubah Runner</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">Manage laundry drop-offs, accept Jubah requests, and handle logistics.</p>
          </a>
        )}

        {roles.includes('admin') && (
          <a href="/admin" className="group relative bg-zinc-900/50 hover:bg-zinc-800/80 backdrop-blur-2xl border border-zinc-800 hover:border-zinc-500 rounded-2xl p-8 transition-all duration-300 shadow-lg overflow-hidden cursor-pointer">
            <div className="w-12 h-12 bg-white text-black flex items-center justify-center rounded-xl mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
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
