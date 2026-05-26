'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from './actions'

interface Props {
  userId: string
  currentRoles: string[]
}

export default function RoleUpdater({ userId, currentRoles }: Props) {
  const [isPending, startTransition] = useTransition()
  // Ensure we always have an array
  const safeRoles = currentRoles || []
  
  const [roles, setRoles] = useState<string[]>(safeRoles)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const toggleRole = (targetRole: string) => {
    // Optimistic UI update
    const newRoles = roles.includes(targetRole)
      ? roles.filter(r => r !== targetRole)
      : [...roles, targetRole]
    
    setRoles(newRoles)
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateUserRole(userId, newRoles)
      if (!result.success) {
        setError(result.error || 'Failed to update')
        setRoles(safeRoles) // Revert on failure
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
        <button
          disabled={isPending}
          onClick={() => toggleRole('driver')}
          className={`px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-md transition-all ${
            roles.includes('driver') 
              ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-400' 
              : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10'
          }`}
        >
          Driver
        </button>
        <button
          disabled={isPending}
          onClick={() => toggleRole('food_runner')}
          className={`px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-md transition-all ${
            roles.includes('food_runner') 
              ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)] border border-orange-400' 
              : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10'
          }`}
        >
          Food
        </button>
        <button
          disabled={isPending}
          onClick={() => toggleRole('jubah_runner')}
          className={`px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-md transition-all ${
            roles.includes('jubah_runner') 
              ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)] border border-pink-400' 
              : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10'
          }`}
        >
          Jubah
        </button>
        <button
          disabled={isPending}
          onClick={() => toggleRole('admin')}
          className={`px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-md transition-all ${
            roles.includes('admin') 
              ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-emerald-400' 
              : 'bg-zinc-100 dark:bg-white/5 text-zinc-400 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10'
          }`}
        >
          Admin
        </button>
      </div>
      
      {isPending && <svg className="animate-spin w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
      {success && <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
      {error && <span className="text-red-500 dark:text-red-400 text-[10px] font-bold uppercase" title={error}>Failed</span>}
    </div>
  )
}
