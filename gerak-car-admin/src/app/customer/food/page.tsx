import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function CustomerFoodDashboard() {
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
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="w-24 h-24 bg-amber-100 text-amber-500 flex items-center justify-center rounded-3xl mb-8 border border-amber-200 shadow-xl">
         <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-800 mb-4">Campus Cafeteria</h1>
      <p className="text-slate-500 max-w-md mb-8">This module is under construction. Soon, you will be able to order food from university restaurants directly to your dorm.</p>
      <a href="/customer" className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all font-bold">Return to Dashboard</a>
    </div>
  )
}
