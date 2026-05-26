import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import DriverMapClient from './DriverMapClient'

export default async function DriverDashboard() {
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

  // Safely check if profile exists and has roles
  const hasAccess = profile && profile.roles && (profile.roles.includes('driver') || profile.roles.includes('admin'))

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 max-w-md text-center shadow-[0_0_50px_rgba(255,0,0,0.15)] relative overflow-hidden">
           <h1 className="text-2xl font-extrabold text-white mb-2">Access Denied</h1>
           <p className="text-zinc-400 mb-8 font-medium">Your profile was not found or lacks driver access. Please sign out and try again.</p>
           <div className="space-y-3">
             <a href="/" className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg w-full block">
               Retry Connection
             </a>
             <form action="/auth/signout" method="post">
                <button className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg w-full block">
                  Sign Out
                </button>
             </form>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[100dvh] bg-black overflow-hidden relative">
      <DriverMapClient />
    </div>
  )
}
