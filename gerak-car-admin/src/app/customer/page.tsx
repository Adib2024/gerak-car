import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import CustomerMapClient from './CustomerMapClient'

export default async function CustomerDashboard() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

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
             <p className="text-cyan-400 font-bold text-xs tracking-wider uppercase">Welcome, {profile.name || user.email?.split('@')[0] || 'Customer'}</p>
           </div>
        </div>
        <form action="/auth/signout" method="post">
           <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-inner">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           </button>
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 w-full relative">
         <CustomerMapClient />
      </main>
    </div>
  )
}
