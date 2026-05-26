import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function CustomerJubahDashboard() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="w-24 h-24 bg-blue-100 text-blue-500 flex items-center justify-center rounded-3xl mb-8 border border-blue-200 shadow-xl">
         <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-800 mb-4">Jubah Delivery</h1>
      <p className="text-slate-500 max-w-md mb-8">This module is under construction. Soon, you will be able to order your convocation robe and have it delivered directly to you.</p>
      <a href="/customer" className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all font-bold">Return to Dashboard</a>
    </div>
  )
}
