import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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

  const hasAccess = profile && profile.roles && (profile.roles.includes('customer') || profile.roles.includes('admin'))

  if (!hasAccess) {
    redirect('/')
  }

  const firstName = profile.name ? profile.name.split(' ')[0] : 'Student'
  
  // Real data defaults to 0 for production
  const walletBalance = 0.00
  const rewardsPoints = 0

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 relative w-full overflow-hidden">
      
      {/* Header Section */}
      <header className="bg-white pt-6 pb-4 px-4 sm:px-8 lg:px-12 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
            G
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-slate-800 text-lg sm:text-xl tracking-tight">GERAK</span>
            <span className="text-[10px] sm:text-xs font-bold text-red-500 tracking-wider">SMART CAMPUS</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center bg-zinc-100 rounded-full py-2 px-4 border border-zinc-200 shadow-inner">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            <span className="text-sm font-extrabold text-slate-800">RM {walletBalance.toFixed(2)}</span>
          </div>
          
          <div className="hidden sm:flex items-center bg-amber-50 rounded-full py-2 px-4 border border-amber-100 shadow-inner">
            <svg className="w-4 h-4 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            <span className="text-sm font-extrabold text-amber-700">{rewardsPoints} pts</span>
          </div>
          
          <div className="relative cursor-pointer">
            <svg className="w-6 h-6 text-slate-600 hover:text-slate-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white">0</div>
          </div>

          <form action="/auth/signout" method="post" className="ml-2">
            <button title="Sign Out" className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
               <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </form>
        </div>
      </header>

      {/* Mobile only balance/points row */}
      <div className="sm:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
         <div className="flex items-center bg-zinc-100 rounded-full py-1.5 px-3 border border-zinc-200">
            <svg className="w-3.5 h-3.5 text-red-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            <span className="text-xs font-extrabold text-slate-800">RM {walletBalance.toFixed(2)}</span>
          </div>
          <div className="flex items-center bg-amber-50 rounded-full py-1.5 px-3 border border-amber-100">
            <svg className="w-3.5 h-3.5 text-amber-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            <span className="text-xs font-extrabold text-amber-700">{rewardsPoints} pts</span>
          </div>
      </div>

      <main className="p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto space-y-6 lg:space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Primary Identity Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(16,185,129,0.3)] relative overflow-hidden text-white flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[40px] rounded-full" />
            
            <div>
               <div className="flex justify-between items-center mb-6 relative z-10">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                     <svg className="w-4 h-4 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     <span className="text-[10px] sm:text-xs font-extrabold tracking-wider uppercase">Verified Campus Account</span>
                  </div>
               </div>

               <div className="relative z-10 mb-8 sm:mb-12">
                 <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Hello, {firstName}!</h2>
                 <p className="text-emerald-50 text-sm sm:text-base font-medium opacity-90">Where would you like to gerak today?</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-inner">
                 <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 mb-1">GerakPay Credit</p>
                 <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">RM {walletBalance.toFixed(2)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-inner">
                 <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 mb-1">Campus Rewards</p>
                 <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{rewardsPoints} pts</p>
              </div>
            </div>
          </div>

          {/* Promo Banner */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(249,115,22,0.3)] relative overflow-hidden text-white flex flex-col justify-between">
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/20 blur-[30px] rounded-full" />
             <div className="flex justify-between items-start relative z-10 mb-8">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-extrabold tracking-wider uppercase border border-white/20">Food Deal</span>
                <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
             </div>
             <div className="relative z-10">
                <h3 className="text-2xl font-extrabold leading-tight mb-2">Kampus Food Express</h3>
                <p className="text-sm sm:text-base text-orange-50 font-medium leading-relaxed mb-6">Enjoy RM3.00 flat delivery fees across all college dormitories. Browse local stalls now.</p>
                <a href="/customer/food" className="inline-block bg-white text-orange-600 font-extrabold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow-lg">Order Now</a>
             </div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="pt-4 pb-10">
           <h3 className="text-sm sm:text-base font-extrabold text-slate-400 tracking-widest uppercase mb-6 pl-2">Campus Modules</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Module 1 */}
              <a href="/customer/ride" className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-slate-300 transition-all group overflow-hidden relative">
                 <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-500 rounded-l-3xl" />
                 <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 ml-2 group-hover:scale-105 transition-transform">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                 </div>
                 <div className="flex-1 pr-4">
                    <h4 className="text-slate-800 font-extrabold text-lg mb-1">Campus Shuttles</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Book point-to-point campus travel. Live path tracking.</p>
                 </div>
                 <svg className="w-6 h-6 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>

              {/* Module 2 */}
              <a href="/customer/jubah" className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-slate-300 transition-all group overflow-hidden relative">
                 <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 rounded-l-3xl" />
                 <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 ml-2 group-hover:scale-105 transition-transform">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                 </div>
                 <div className="flex-1 pr-4">
                    <h4 className="text-slate-800 font-extrabold text-lg mb-1">Jubah Delivery</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Convocation robe size calculator, deliveries & returns.</p>
                 </div>
                 <svg className="w-6 h-6 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>

              {/* Module 3 */}
              <a href="/customer/food" className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md hover:border-slate-300 transition-all group overflow-hidden relative">
                 <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-400 rounded-l-3xl" />
                 <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 ml-2 group-hover:scale-105 transition-transform">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                 </div>
                 <div className="flex-1 pr-4">
                    <h4 className="text-slate-800 font-extrabold text-lg mb-1">Campus Cafeteria</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Browse student cafe menus and order quick dorm delivery.</p>
                 </div>
                 <svg className="w-6 h-6 text-slate-300 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
           </div>
        </div>
      </main>

      {/* Bottom Navigation - Fixed width on large screens to act as a floating island, full width on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 bg-white sm:rounded-full border-t sm:border border-slate-200 px-6 sm:px-12 py-3 pb-6 sm:pb-3 flex justify-between items-center z-50 w-full sm:max-w-md shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
        <a href="/customer" className="flex flex-col items-center gap-1 text-red-500 group">
           <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
           <span className="text-[10px] font-extrabold">Home</span>
           <div className="w-1 h-1 bg-red-500 rounded-full mt-0.5"></div>
        </a>
        <a href="/customer/ride" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors group">
           <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
           <span className="text-[10px] font-bold">Ride</span>
           <div className="w-1 h-1 bg-transparent rounded-full mt-0.5"></div>
        </a>
        <a href="/customer/food" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors group">
           <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
           <span className="text-[10px] font-bold">Food</span>
           <div className="w-1 h-1 bg-transparent rounded-full mt-0.5"></div>
        </a>
        <a href="/customer/jubah" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors group">
           <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
           <span className="text-[10px] font-bold">Jubah</span>
           <div className="w-1 h-1 bg-transparent rounded-full mt-0.5"></div>
        </a>
        <form action="/auth/signout" method="post" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-800 transition-colors group cursor-pointer">
           <button title="Sign Out">
              <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="text-[10px] font-bold block mt-1">Logout</span>
              <div className="w-1 h-1 bg-transparent rounded-full mt-0.5 mx-auto"></div>
           </button>
        </form>
      </nav>
    </div>
  )
}
