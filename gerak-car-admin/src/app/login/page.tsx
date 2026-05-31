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
    <div className="relative flex min-[100dvh] flex-col overflow-hidden bg-white dark:bg-black transition-colors duration-300">
      
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4 z-50">
         <ThemeToggle variant="icon" />
      </div>

      <div className="w-full max-w-md mx-auto px-6 py-12 sm:py-20 flex flex-col flex-1">
          <div className="flex justify-start mb-10 mt-10 sm:mt-0">
             <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black dark:bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg relative">
                <Image src="/logo.png" alt="Gerak Car Logo" fill className="object-cover" />
             </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black dark:text-white mb-3 tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-base sm:text-lg">
            {isSignUp ? 'Enter your details to get started.' : 'Sign in to access your Gerak Car account.'}
          </p>
          
          {/* Minimalist Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl mb-8">
             <button 
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); setSuccess(null); }}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${!isSignUp ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
             >
                Sign In
             </button>
             <button 
                type="button"
                onClick={() => { setIsSignUp(true); setError(null); setSuccess(null); }}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${isSignUp ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
             >
                Sign Up
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex-1">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-black dark:focus:border-white rounded-xl px-5 py-4 text-black dark:text-white placeholder-zinc-500 focus:outline-none transition-all text-base"
                placeholder="Email address"
                required
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-black dark:focus:border-white rounded-xl px-5 py-4 text-black dark:text-white placeholder-zinc-500 focus:outline-none transition-all text-base"
                placeholder="Password"
                required
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-500 font-medium px-1">{error}</p>
            )}
            
            {success && (
              <p className="text-sm text-emerald-500 font-medium px-1">{success}</p>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-black dark:bg-white text-white dark:text-black font-bold py-4 px-4 rounded-xl transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-lg shadow-sm"
              >
                 {loading ? (
                   <svg className="animate-spin h-6 w-6 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 ) : (
                   isSignUp ? 'Create Account' : 'Continue'
                 )}
              </button>
            </div>
          </form>
      </div>
    </div>
  )
}
