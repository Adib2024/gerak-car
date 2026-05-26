import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CustomerMapClient from '../CustomerMapClient'

export default async function RideDashboard() {
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
  const hasAccess = profile && profile.roles && (profile.roles.includes('customer') || profile.roles.includes('admin'))

  if (!hasAccess) {
    // Fetch auth error if any, just to be safe
    const { error: profileError } = await supabase.from('users').select('*').eq('id', user.id).single()

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 max-w-md text-center shadow-[0_0_50px_rgba(255,0,0,0.15)] relative overflow-hidden">
           <h1 className="text-2xl font-extrabold text-white mb-2">Access Denied</h1>
           <p className="text-zinc-400 mb-6 font-medium">Your profile was not found or lacks customer access. Please sign out and try again.</p>
           
           <div className="bg-red-950/40 p-4 rounded-xl mb-8 text-left border border-red-500/30 overflow-auto">
              <p className="text-red-400 font-bold text-xs mb-2 uppercase tracking-wide">Diagnostic Data:</p>
              <pre className="text-xs text-red-200 font-mono whitespace-pre-wrap">
{`Auth UID: ${user.id}
Email: ${user.email}
Profile Data: ${JSON.stringify(profile, null, 2)}
DB Error: ${JSON.stringify(profileError, null, 2)}`}
              </pre>
           </div>

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
      <CustomerMapClient />
      
      {/* Back button to return to dashboard */}
      <a href="/customer" className="absolute top-6 left-6 z-50 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 shadow-lg hover:bg-white/20 transition-all">
         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </a>
    </div>
  )
}
