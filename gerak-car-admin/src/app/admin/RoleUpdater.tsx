'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from './actions'

interface Props {
  userId: string
  currentRole: string
}

export default function RoleUpdater({ userId, currentRole }: Props) {
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState(currentRole)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'admin' | 'driver' | 'customer'
    setRole(newRole)
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)
      if (!result.success) {
        setError(result.error || 'Failed to update')
        setRole(currentRole) // Revert on failure
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        disabled={isPending}
        value={role}
        onChange={handleRoleChange}
        className={`bg-black/50 border rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
           role === 'admin' ? 'text-emerald-400 border-emerald-500/30' :
           role === 'driver' ? 'text-blue-400 border-blue-500/30' :
           'text-zinc-400 border-white/10'
        } disabled:opacity-50`}
      >
        <option value="customer" className="bg-zinc-900 text-zinc-300">Customer</option>
        <option value="driver" className="bg-zinc-900 text-blue-400">Driver</option>
        <option value="admin" className="bg-zinc-900 text-emerald-400">Admin</option>
      </select>
      
      {isPending && <svg className="animate-spin w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
      {success && <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
      {error && <span className="text-red-400 text-xs font-bold" title={error}>Failed</span>}
    </div>
  )
}
