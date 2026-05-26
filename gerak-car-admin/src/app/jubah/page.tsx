import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function JubahRunnerDashboard() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  const hasAccess = profile && profile.roles && (profile.roles.includes('jubah_runner') || profile.roles.includes('admin'))

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 max-w-md text-center shadow-[0_0_50px_rgba(255,0,255,0.15)] relative overflow-hidden">
           <h1 className="text-2xl font-extrabold text-white mb-2">Access Denied</h1>
           <p className="text-zinc-400 mb-8 font-medium">Your profile lacks Jubah Runner access.</p>
           <a href="/" className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg w-full block">
             Return Home
           </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-pink-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="w-24 h-24 bg-pink-500/10 text-pink-400 flex items-center justify-center rounded-3xl mb-8 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
         <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-4">Jubah Runner Portal</h1>
      <p className="text-zinc-400 max-w-md mb-8">This module is under construction. Soon, you will be able to manage laundry drop-offs and accept Jubah logistics requests.</p>
      <a href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all font-bold">Back to Portals</a>
    </div>
  )
}
