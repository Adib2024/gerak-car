'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        if (data.user?.identities?.length === 0) {
          setError('An account with this email already exists.')
        } else {
          setSuccess('Account created successfully! You can now sign in.')
          setIsSignUp(false)
        }
      }
      setLoading(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // FAST ROUTING: Skip the manual database query!
        // Just push to the root page, and the blazing-fast Server Component 
        // will read your secure cookie and instantly redirect you to your correct dashboard!
        router.push('/')
        router.refresh()
      }
    }
  }

  return (
  return (
    <div className="relative flex min-h-screen flex-col justify-center items-center overflow-hidden bg-zinc-50 dark:bg-black transition-colors duration-300">
      
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-50 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-xl shadow-lg border border-zinc-200 dark:border-white/10 p-2">
         <ThemeToggle />
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <Image 
           src="/login-bg.png" 
           alt="City Background" 
           fill
           priority
           className="object-cover opacity-20 dark:opacity-60 scale-105"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-50/80 to-transparent dark:from-black dark:via-black/40 dark:to-black/20" />
      </div>

      {/* Login Card */}
      <div className="z-10 w-full max-w-md p-8 bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/10 rounded-[2rem] shadow-xl dark:shadow-[0_0_50px_rgba(16,185,129,0.15)] mx-4 relative overflow-hidden">
        {/* Subtle glow effect inside the card */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
             <div className="w-20 h-20 bg-white dark:bg-black/50 p-2 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-md dark:shadow-2xl flex items-center justify-center overflow-hidden relative">
                <Image src="/logo.png" alt="Gerak Car Logo" fill className="object-cover" />
             </div>
          </div>
          
          <h2 className="text-3xl font-extrabold text-center text-black dark:text-white mb-2 tracking-tight">
            Gerak Car
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8 text-sm font-medium">
            {isSignUp ? 'Create a new account' : 'Welcome back, sign in to continue'}
          </p>
          
          {/* Tabs */}
          <div className="flex bg-zinc-100 dark:bg-black/60 p-1.5 rounded-xl mb-8 border border-zinc-200 dark:border-white/5 shadow-inner">
             <button 
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${!isSignUp ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-md' : 'text-zinc-500 dark:hover:text-zinc-300 hover:text-zinc-700'}`}
             >
                Sign In
             </button>
             <button 
                type="button"
                onClick={() => { setIsSignUp(true); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${isSignUp ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-md' : 'text-zinc-500 dark:hover:text-zinc-300 hover:text-zinc-700'}`}
             >
                Sign Up
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                placeholder="student@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3.5 backdrop-blur-md">
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3.5 backdrop-blur-md">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center font-medium">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-extrabold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center justify-center gap-2 tracking-wide">
                 {loading ? (
                   <>
                     <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     PROCESSING...
                   </>
                 ) : (
                   isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'
                 )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
