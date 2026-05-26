'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, newRoles: string[]) {
  const supabase = await createClient()

  // Verify the current user is an admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('Auth Error in Server Action:', authError)
    return { success: false, error: 'Not authenticated. Please refresh the page.' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('admin')) {
    return { success: false, error: 'Unauthorized: Admin access required.' }
  }

  // Ensure 'customer' is always in the array so they don't get locked out
  const finalRoles = Array.from(new Set([...newRoles, 'customer']))

  // Update the target user's role
  const { error } = await supabase
    .from('users')
    .update({ roles: finalRoles })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update role:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}
