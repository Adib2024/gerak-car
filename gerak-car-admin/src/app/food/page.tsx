import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function FoodRunnerDashboard() {
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

  const hasAccess = profile && profile.roles && (profile.roles.includes('food_runner') || profile.roles.includes('admin'))

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 max-w-md text-center shadow-[0_0_50px_rgba(255,100,0,0.15)] relative overflow-hidden">
           <h1 className="text-2xl font-extrabold text-white mb-2">Access Denied</h1>
           <p className="text-zinc-400 mb-8 font-medium">Your profile lacks Food Runner access.</p>
           <a href="/" className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg w-full block">
             Return Home
           </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="w-24 h-24 bg-orange-500/10 text-orange-400 flex items-center justify-center rounded-3xl mb-8 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
         <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-4">Food Runner Portal</h1>
      <p className="text-zinc-400 max-w-md mb-8">This module is under construction. Soon, you will be able to accept food orders from university restaurants and deliver them to students.</p>
      <a href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all font-bold">Back to Portals</a>
    </div>
  )
}
